#!/usr/bin/env python3
"""Offline Council context/relay contract tools. No network, agent calls or shell execution."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
NAMES = ("Buddy", "Cora", "Gem", "Finch", "Boons", "Allen", "Bucky", "Charlie")
COMMON = ("START_HERE.md", "CHARTER.md", "IDENTITY.md", "MEMORY.md", "HANDOFF.md")
STATES = {"queued", "delivered", "acknowledged", "running", "blocked",
          "completed", "reviewed", "integrated"}
MAX_BYTES = 131072


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    data = Path(path).read_bytes()
    require(len(data) <= MAX_BYTES, "JSON exceeds size bound")
    return json.loads(data)


def stamp(value):
    require(isinstance(value, str), "timestamp must be a string")
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    require(dt.tzinfo is not None and dt.utcoffset() == timedelta(0),
            "timestamp must have UTC timezone")
    return dt


def utc_now():
    return datetime.now(timezone.utc)


def iso(dt):
    return dt.isoformat(timespec="seconds").replace("+00:00", "Z")


def text_id(value, label):
    require(isinstance(value, str) and
            re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,159}", value),
            label + " is invalid")


def validate_registry(data):
    require(data.get("schema_version") == 1, "unsupported registry schema")
    require(data.get("sampling_status") == "new_proposed_defaults_not_applied",
            "sampling provenance missing")
    entries = data.get("personas")
    require(isinstance(entries, list) and len(entries) == len(NAMES),
            "registry requires eight personas")
    require({p.get("original_name") for p in entries} == set(NAMES),
            "original identities differ")
    require(len({p.get("persona_id") for p in entries}) == len(NAMES),
            "duplicate persona")
    for p in entries:
        name = p["original_name"]
        require(p.get("persona_id") == name.lower(), "unstable persona ID")
        require(p.get("runtime_name") == name + "-Switch", "runtime partition missing")
        require(p.get("profile") == "profiles/" + name.lower() + ".md",
                "unsafe/unexpected profile path")
        require(isinstance(p.get("emoji"), str) and bool(p["emoji"]), "missing emoji")
        t = p.get("temperature", {})
        for mode in ("routine", "exploration", "evidence"):
            v = t.get(mode)
            require(type(v) in (int, float) and 0 <= v <= 1,
                    "invalid proposed temperature")
        require(t.get("support") == "unknown" and t.get("applied") is None,
                "public registry must not claim live sampling settings")
    return entries


def safe_file(root, relative):
    require(isinstance(relative, str), "path must be text")
    path = Path(relative)
    require(not path.is_absolute() and ".." not in path.parts, "unsafe package path")
    target = root / path
    require(target.is_file() and not target.is_symlink(), "missing/linked package file")
    require(target.resolve().is_relative_to(root.resolve()), "path escapes package")
    return target


def verify(root=ROOT):
    root = Path(root)
    entries = validate_registry(read_json(root / "agents/registry.json"))
    manifest = read_json(root / "agents/manifest.json")
    require(manifest.get("schema_version") == 1, "unsupported manifest schema")
    expected = manifest.get("files")
    require(isinstance(expected, dict) and bool(expected), "empty manifest")
    actual = {"AGENTS.md"} | {
        str(p.relative_to(root)) for p in (root / "agents").rglob("*")
        if p.is_file() and p != root / "agents/manifest.json"
    }
    require(set(expected) == actual, "manifest inventory mismatch")
    for relative, digest in expected.items():
        target = safe_file(root, relative)
        require(re.fullmatch(r"[0-9a-f]{64}", digest), "invalid digest")
        require(hashlib.sha256(target.read_bytes()).hexdigest() == digest,
                "integrity mismatch: " + relative)
    for p in entries:
        safe_file(root, "agents/" + p["profile"])
    for name in COMMON:
        safe_file(root, "agents/" + name)
    return len(expected)


def validate_sampling(sampling):
    require(sampling.get("support") in {"supported", "unsupported", "unknown"},
            "invalid sampling support")
    applied = sampling.get("applied_temperature")
    requested = sampling.get("requested_temperature")
    require(requested is None or (type(requested) in (int, float) and 0 <= requested <= 2),
            "invalid requested setting")
    if sampling["support"] != "supported":
        require(applied is None, "unsupported/unknown setting cannot be applied")
    if applied is not None:
        require(type(applied) in (int, float) and 0 <= applied <= 2,
                "invalid applied setting")
        require(bool(sampling.get("evidence")), "applied setting needs evidence")
        stamp(sampling.get("observed_at"))
    return True


def wake_key(wake):
    return (wake["source_repo"] + ":" + wake["source_event_id"] + ":" +
            wake["target_runtime"] + ":r" + str(wake["revision"]))


def validate_wake(wake, now=None):
    require(isinstance(wake, dict) and wake.get("schema_version") == 1,
            "unsupported wake schema")
    now = now or utc_now()
    require(now.tzinfo is not None, "comparison time requires timezone")
    for key in ("mission_id", "correlation_id", "source_event_id"):
        text_id(wake.get(key), key)
    require(type(wake.get("revision")) is int and wake["revision"] > 0,
            "revision must be positive")
    require(wake.get("target_runtime") in {n + "-Switch" for n in NAMES},
            "unknown target runtime")
    handle = wake.get("target_handle")
    require(isinstance(handle, str) and re.fullmatch(r"[a-z0-9][a-z0-9._-]{0,99}", handle),
            "invalid transport handle")
    repo = wake.get("source_repo")
    require(isinstance(repo, str) and
            re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo),
            "invalid source repository")
    event = re.fullmatch(r"comment-([1-9][0-9]*)", wake["source_event_id"])
    require(event is not None, "this version supports issue-comment sources only")
    source = wake.get("source_ref")
    pattern = (r"https://github\.com/" + re.escape(repo) +
               r"/issues/[1-9][0-9]*#issuecomment-" + event.group(1))
    require(isinstance(source, str) and re.fullmatch(pattern, source),
            "source URL/repository/event mismatch")
    sha = wake.get("package_sha")
    require(isinstance(sha, str) and re.fullmatch(r"[0-9a-f]{40}", sha) and
            sha != "0" * 40, "approved package SHA required")
    created = stamp(wake.get("created_at"))
    expires = stamp(wake.get("expires_at"))
    require(timedelta(0) < expires - created <= timedelta(hours=1), "invalid wake TTL")
    require(created <= now + timedelta(seconds=60), "wake created in future")
    require(now < expires, "wake expired")
    require(wake.get("status") == "queued", "cancelled/nonqueued wake")
    require(wake.get("dedup_key") == wake_key(wake), "dedup key mismatch")
    return True


def validate_receipt(receipt, wake, observed_runtime):
    """Structural correlation only; caller must authenticate observed_runtime."""
    require(isinstance(receipt, dict) and receipt.get("schema_version") == 1,
            "unsupported receipt schema")
    for field in ("mission_id", "correlation_id", "dedup_key", "source_ref"):
        require(receipt.get(field) == wake.get(field), "receipt " + field + " mismatch")
    state = receipt.get("state")
    require(state in STATES, "unknown receipt state")
    stamp(receipt.get("observed_at"))
    require(receipt.get("runtime_name") == observed_runtime,
            "observed author differs from claimed runtime")
    if state in {"acknowledged", "running", "blocked", "completed"}:
        require(observed_runtime == wake["target_runtime"], "wrong recipient receipt")
        text_id(receipt.get("boot_id"), "boot_id")
    if state == "delivered":
        require(bool(receipt.get("transport_ref")), "delivery needs transport evidence")
    if state == "completed":
        refs = receipt.get("artifact_refs")
        require(isinstance(refs, list) and bool(refs) and
                all(isinstance(r, str) and bool(r.strip()) for r in refs),
                "completion needs artifact references")
        require(receipt.get("result") in {"pass", "fail"}, "completion result is unknown")
    return True


def packet(runtime, root=ROOT):
    verify(root)
    entries = read_json(Path(root) / "agents/registry.json")["personas"]
    entry = next((p for p in entries if p["runtime_name"] == runtime), None)
    require(entry is not None, "unknown runtime")
    files = ["AGENTS.md"] + ["agents/" + n for n in COMMON]
    files += ["agents/" + entry["profile"], "agents/SAMPLING.md"]
    chunks = ["# Public bootstrap packet for " + runtime +
              "\nPrivate memory and actual capabilities must be read separately."]
    for relative in files:
        chunks.append("\n---\nSource: " + relative + "\n\n" +
                      safe_file(Path(root), relative).read_text())
    return "\n".join(chunks)


def init_private(destination, root=ROOT):
    verify(root)
    dest = Path(destination)
    # mkdir is exclusive: existing files/directories/symlinks are never reused.
    dest.mkdir(mode=0o700)
    for source in sorted((Path(root) / "agents/templates").iterdir()):
        if source.is_file() and not source.is_symlink():
            with (dest / source.name).open("x", encoding="utf-8") as output:
                output.write(source.read_text())
    return dest


def make_wake(target, source_ref, repo, package_sha, now=None):
    now = now or utc_now()
    match = re.search(r"#issuecomment-([1-9][0-9]*)$", source_ref)
    require(match is not None, "canonical issue-comment URL required")
    wake = {
        "schema_version": 1, "mission_id": "dry-run-" + uuid4().hex,
        "revision": 1, "correlation_id": uuid4().hex,
        "target_runtime": target, "target_handle": "unconfigured-dry-run-only",
        "source_repo": repo, "source_event_id": "comment-" + match.group(1),
        "source_ref": source_ref, "package_sha": package_sha,
        "created_at": iso(now), "expires_at": iso(now + timedelta(minutes=15)),
        "status": "queued"
    }
    wake["dedup_key"] = wake_key(wake)
    validate_wake(wake, now)
    return wake


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("verify")
    p = sub.add_parser("packet")
    p.add_argument("runtime")
    p = sub.add_parser("init-private")
    p.add_argument("destination")
    p = sub.add_parser("check-wake")
    p.add_argument("file")
    p = sub.add_parser("make-wake")
    for flag in ("target", "source-ref", "repo", "package-sha"):
        p.add_argument("--" + flag, required=True)
    args = parser.parse_args()
    try:
        if args.command == "verify":
            print("PASS:", verify(), "public context files verified; live checks UNKNOWN")
        elif args.command == "packet":
            print(packet(args.runtime))
        elif args.command == "init-private":
            print("Created synthetic private templates:", init_private(args.destination))
        elif args.command == "check-wake":
            validate_wake(read_json(args.file))
            print("PASS: envelope structure/freshness; authorization and delivery NOT checked")
        elif args.command == "make-wake":
            print(json.dumps(make_wake(args.target, args.source_ref,
                                      args.repo, args.package_sha), indent=2))
    except (ValueError, OSError, KeyError, TypeError) as error:
        print("ERROR:", str(error), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
