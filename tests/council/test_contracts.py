"""Semantic failure-case checks for the offline Council contracts."""
import copy
from datetime import datetime, timedelta, timezone
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("council_package", ROOT / "scripts/council_package.py")
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


class Contracts(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 4, 12, 0, tzinfo=timezone.utc)
        self.wake = c.make_wake(
            "Finch-Switch", "https://github.com/example/council-private/issues/4#issuecomment-77",
            "example/council-private", "a" * 40, self.now)

    def test_valid_current_envelope(self):
        self.assertTrue(c.validate_wake(self.wake, self.now))

    def test_duplicate_key_stable_across_generation_attempts(self):
        second = c.make_wake("Finch-Switch", self.wake["source_ref"],
                             self.wake["source_repo"], "a" * 40, self.now)
        self.assertEqual(self.wake["dedup_key"], second["dedup_key"])
        changed = copy.deepcopy(second)
        changed["revision"] = 2
        self.assertNotEqual(c.wake_key(changed), self.wake["dedup_key"])
        # Generating a new envelope is not a resend; a real retry persists the original.
        self.assertNotEqual(second["correlation_id"], self.wake["correlation_id"])

    def test_expired_at_boundary(self):
        with self.assertRaisesRegex(ValueError, "expired"):
            c.validate_wake(self.wake, c.stamp(self.wake["expires_at"]))

    def test_timestamp_requires_timezone(self):
        for invalid in ("2026-11-04T12:00:00", "2026-11-04T12:00:00-05:00"):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                c.stamp(invalid)

    def test_future_and_excessive_lifetime_rejected(self):
        for created, expires in (
            (self.now + timedelta(minutes=5), self.now + timedelta(minutes=10)),
            (self.now, self.now + timedelta(hours=2)),
            (self.now, self.now),
        ):
            wake = copy.deepcopy(self.wake)
            wake.update(created_at=c.iso(created), expires_at=c.iso(expires))
            with self.subTest(wake=wake), self.assertRaises(ValueError):
                c.validate_wake(wake, self.now)

    def test_cancelled_and_superseded_rejected(self):
        for status in ("cancelled", "superseded", "completed"):
            wake = dict(self.wake, status=status)
            with self.subTest(status=status), self.assertRaises(ValueError):
                c.validate_wake(wake, self.now)

    def test_unknown_target_and_boolean_revision_rejected(self):
        for patch in ({"target_runtime": "Finch"}, {"revision": True},
                      {"target_handle": "@finch"}, {"package_sha": "0" * 40}):
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                c.validate_wake(dict(self.wake, **patch), self.now)

    def test_source_repo_event_and_url_must_match(self):
        for source in (
            "https://github.com/other/private/issues/4#issuecomment-77",
            "https://github.com/example/council-private/issues/4#issuecomment-78",
            "https://github.com.evil.test/example/council-private/issues/4#issuecomment-77",
            self.wake["source_ref"] + "?command=run",
            "file:///tmp/mission",
        ):
            with self.subTest(source=source), self.assertRaises(ValueError):
                c.validate_wake(dict(self.wake, source_ref=source), self.now)

    def test_dedup_tampering_rejected(self):
        with self.assertRaisesRegex(ValueError, "dedup"):
            c.validate_wake(dict(self.wake, dedup_key="other"), self.now)

    def receipt(self, state="acknowledged"):
        return {
            "schema_version": 1,
            **{key: self.wake[key] for key in
               ("mission_id", "correlation_id", "dedup_key", "source_ref")},
            "runtime_name": "Finch-Switch", "boot_id": "boot-1",
            "state": state, "observed_at": c.iso(self.now),
            "artifact_refs": [], "result": "unknown",
        }

    def test_matching_authenticated_target_ack(self):
        self.assertTrue(c.validate_receipt(self.receipt(), self.wake, "Finch-Switch"))

    def test_relay_cannot_ack_for_target(self):
        for receipt, observed in (
            (self.receipt(), "Relay-Switch"),
            (dict(self.receipt(), runtime_name="Cora-Switch"), "Cora-Switch"),
        ):
            with self.subTest(observed=observed), self.assertRaises(ValueError):
                c.validate_receipt(receipt, self.wake, observed)

    def test_wrong_correlation_rejected(self):
        with self.assertRaisesRegex(ValueError, "correlation"):
            c.validate_receipt(dict(self.receipt(), correlation_id="other"),
                               self.wake, "Finch-Switch")

    def test_delivery_needs_transport_evidence(self):
        receipt = self.receipt("delivered")
        with self.assertRaises(ValueError):
            c.validate_receipt(receipt, self.wake, "Finch-Switch")
        receipt["transport_ref"] = "synthetic-message-1"
        self.assertTrue(c.validate_receipt(receipt, self.wake, "Finch-Switch"))

    def test_unknown_is_not_completed(self):
        receipt = self.receipt("completed")
        receipt["artifact_refs"] = ["https://example.test/artifact"]
        with self.assertRaisesRegex(ValueError, "unknown"):
            c.validate_receipt(receipt, self.wake, "Finch-Switch")
        receipt["result"] = "pass"
        self.assertTrue(c.validate_receipt(receipt, self.wake, "Finch-Switch"))
        receipt["artifact_refs"] = []
        with self.assertRaises(ValueError):
            c.validate_receipt(receipt, self.wake, "Finch-Switch")

    def test_unknown_or_unsupported_temperature_cannot_claim_applied(self):
        for support in ("unknown", "unsupported"):
            sampling = {"requested_temperature": .25, "support": support,
                        "applied_temperature": None}
            self.assertTrue(c.validate_sampling(sampling))
            sampling["applied_temperature"] = .25
            with self.subTest(support=support), self.assertRaises(ValueError):
                c.validate_sampling(sampling)

    def test_applied_temperature_requires_evidence_and_timestamp(self):
        sampling = {"requested_temperature": .25, "support": "supported",
                    "applied_temperature": .25}
        with self.assertRaises(ValueError):
            c.validate_sampling(sampling)
        sampling.update(evidence="synthetic-host-config-ref", observed_at=c.iso(self.now))
        self.assertTrue(c.validate_sampling(sampling))

    def test_registry_profiles_partition_and_packet(self):
        self.assertGreater(c.verify(ROOT), 30)
        for name in c.NAMES:
            packet = c.packet(name + "-Switch")
            self.assertIn("Source: agents/profiles/" + name.lower() + ".md", packet)
            self.assertIn("Source: agents/CHARTER.md", packet)
        with self.assertRaises(ValueError):
            c.packet("Finch")

    def test_registry_rejects_duplicate_identity_or_false_applied_setting(self):
        data = c.read_json(ROOT / "agents/registry.json")
        for mutation in ("duplicate", "applied"):
            changed = copy.deepcopy(data)
            if mutation == "duplicate":
                changed["personas"][1]["persona_id"] = changed["personas"][0]["persona_id"]
            else:
                changed["personas"][0]["temperature"]["applied"] = .45
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                c.validate_registry(changed)

    def test_existing_private_state_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "private"
            c.init_private(dest)
            marker = dest / "checkpoint.json"
            marker.write_text("DO NOT OVERWRITE")
            with self.assertRaises(FileExistsError):
                c.init_private(dest)
            self.assertEqual(marker.read_text(), "DO NOT OVERWRITE")
            self.assertEqual(dest.stat().st_mode & 0o777, 0o700)

    def test_symlink_destination_never_followed(self):
        with tempfile.TemporaryDirectory() as tmp:
            real = Path(tmp) / "real"
            real.mkdir()
            link = Path(tmp) / "link"
            link.symlink_to(real, target_is_directory=True)
            with self.assertRaises(FileExistsError):
                c.init_private(link)
            self.assertEqual(list(real.iterdir()), [])

    def test_manifest_detects_changed_and_extra_context(self):
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp)
            shutil.copytree(ROOT / "agents", dest / "agents")
            shutil.copy(ROOT / "AGENTS.md", dest / "AGENTS.md")
            self.assertGreater(c.verify(dest), 30)
            (dest / "agents/CHARTER.md").write_text("modified")
            with self.assertRaisesRegex(ValueError, "integrity"):
                c.verify(dest)
            shutil.copy(ROOT / "agents/CHARTER.md", dest / "agents/CHARTER.md")
            (dest / "agents/untracked-private-state.json").write_text("{}")
            with self.assertRaisesRegex(ValueError, "inventory"):
                c.verify(dest)

    def test_manifest_cannot_escape_checkout(self):
        with tempfile.TemporaryDirectory() as tmp:
            outside = Path(tmp) / "outside"
            outside.write_text("private")
            root = Path(tmp) / "root"
            root.mkdir()
            with self.assertRaises(ValueError):
                c.safe_file(root, "../outside")
            (root / "linked").symlink_to(outside)
            with self.assertRaises(ValueError):
                c.safe_file(root, "linked")

    def test_cli_failure_is_nonzero_and_does_not_claim_delivery(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/council_package.py"),
             "check-wake", str(ROOT / "agents/templates/wake.example.json")],
            capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 2)
        self.assertNotIn("PASS", result.stdout)


if __name__ == "__main__":
    unittest.main()
