#!/usr/bin/env python3
"""Offline negative/positive tests for the Council live-history adapter.

No network, production credentials, Mattermost account, or running Switch is needed.
The host adapter is loopback-only and must not claim fabricated Core receipts.
"""

import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest import mock
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts" / "serve_council_live.py"
SPEC = importlib.util.spec_from_file_location("council_live_bridge", SOURCE)
bridge = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bridge)

CORE_ID = "sw_" + "a" * 32
MM_ID = "b" * 26


def core_event(**overrides):
    event = {
        "event_id": CORE_ID,
        "sender_name": "finch",
        "timestamp": 1794060210000,
        "body": "Independent Council report",
    }
    event.update(overrides)
    return event


class FakeCoreResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.payload


class CouncilBridgeSafetyTests(unittest.TestCase):
    def test_real_core_id_is_preserved_without_fabricated_mattermost_link(self):
        event = bridge.normalize_live_event(core_event(), 0)
        self.assertEqual(event["event_id"], CORE_ID)
        self.assertIsNone(event["mm_post_id"])
        self.assertIsNone(event["own_seat"])
        self.assertFalse(event["source_verified_link"])
        self.assertEqual(event["provenance"], "LIVE_EVENT")

    def test_real_mattermost_id_is_kept_separate_from_switch_event_id(self):
        event = bridge.normalize_live_event(
            core_event(mm_post_id=MM_ID, own_seat=False), 0
        )
        self.assertEqual(event["event_id"], CORE_ID)
        self.assertEqual(event["mm_post_id"], MM_ID)
        self.assertTrue(event["source_verified_link"])
        self.assertIs(event["own_seat"], False)

    def test_missing_id_is_not_recovered_from_untrusted_message_text(self):
        example = core_event(body="claimed sw_" + "c" * 32)
        del example["event_id"]
        self.assertIsNone(bridge.normalize_live_event(example, 0))

    def test_placeholder_malformed_and_mattermost_only_ids_are_rejected(self):
        for bad in ("sw_receipt_fake", "sw_" + "a" * 16, MM_ID, "fake_" + "a" * 32):
            with self.subTest(id=bad):
                self.assertIsNone(bridge.normalize_live_event(core_event(event_id=bad), 0))

    def test_missing_or_invalid_timestamp_does_not_become_now(self):
        for bad in (None, "1794060210000", -1, 0):
            with self.subTest(ts=bad):
                self.assertIsNone(
                    bridge.normalize_live_event(core_event(timestamp=bad), 0)
                )

    def test_unknown_sender_does_not_claim_known_seat_or_own_status(self):
        event = bridge.normalize_live_event(
            core_event(sender_name="@switch-agent-unknown:localhost"), 0
        )
        self.assertEqual(event["sender_id"], "unknown")
        self.assertIsNone(event["own_seat"])

    def test_live_history_filters_unverified_core_events(self):
        payload = {"events": [
            core_event(),
            {"sender_name": "jay", "body": "sw_" + "d" * 32,
             "timestamp": 1794060210001},
        ]}
        with mock.patch.object(bridge, "discover_config",
                               return_value=("http://127.0.0.1:8000",
                                             "test-room", "test-agent", "test-key")):
            with mock.patch.object(bridge.urllib.request, "urlopen",
                                   return_value=FakeCoreResponse(payload)):
                result = bridge.fetch_switch_core_history()
        self.assertTrue(result["ok"])
        self.assertTrue(result["verified_by_host_proxy"])
        self.assertEqual(result["count"], 1)
        self.assertEqual(result["events"][0]["event_id"], CORE_ID)

    def test_malformed_core_payload_fails_closed(self):
        with mock.patch.object(bridge, "discover_config",
                               return_value=("http://127.0.0.1:8000",
                                             "test-room", "test-agent", "test-key")):
            with mock.patch.object(bridge.urllib.request, "urlopen",
                                   return_value=FakeCoreResponse({"events": "not-a-list"})):
                result = bridge.fetch_switch_core_history()
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"], 502)
        self.assertNotIn("verified_by_host_proxy", result)

    def test_missing_host_credentials_fails_closed(self):
        with mock.patch.object(bridge, "discover_config",
                               return_value=("http://127.0.0.1:8000", None, None, None)):
            result = bridge.fetch_switch_core_history()
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"], 401)

    def test_bearer_auth_failure_is_not_verified_history(self):
        unauthorized = urllib.error.HTTPError(
            "http://127.0.0.1:8000", 401, "unauthorized", {}, io.BytesIO(b"")
        )
        with mock.patch.object(bridge, "discover_config",
                               return_value=("http://127.0.0.1:8000",
                                             "test-room", "test-agent", "test-key")):
            with mock.patch.object(bridge.urllib.request, "urlopen", side_effect=unauthorized):
                result = bridge.fetch_switch_core_history()
        self.assertFalse(result["ok"])
        self.assertEqual(result["status"], 401)

    def test_host_server_is_loopback_bound_only(self):
        source_text = SOURCE.read_text(encoding="utf-8")
        self.assertIn('socketserver.TCPServer(("127.0.0.1", PORT)', source_text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
