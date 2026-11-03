#!/usr/bin/env python3
"""Zero-dependency verification for the public Orocue repository foundation.

Only checks public hygiene and truthful documentation. This is NOT an app test.
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
errors: list[str] = []

if not re.fullmatch(r"v\d{3}\.\d{2}", VERSION):
    errors.append(f"VERSION must use vNNN.NN, got {VERSION!r}")

readme = (ROOT / "README.md").read_text(encoding="utf-8")
if "<!-- OROCUE_DOCS_READY -->" in readme:
    must_have = [
        "## The problem", "## One room. One decision.", "## Current status",
        "## Run it yourself", "## Repository map", "## Versioning",
        "## Verification", "## Known limitations",
    ]
    for header in must_have:
        if header not in readme:
            errors.append(f"Missing README section: {header}")
    if f"Current repository version: {VERSION}" not in readme:
        errors.append("README current version does not match VERSION")
    changelog = ROOT / "CHANGELOG.md"
    if not changelog.exists() or f"## {VERSION}" not in changelog.read_text(encoding="utf-8"):
        errors.append("CHANGELOG needs a heading for current VERSION")

try:
    tracked = subprocess.check_output(
        ["git", "ls-files"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
    ).splitlines()
except (OSError, subprocess.CalledProcessError):
    tracked = [
        str(p.relative_to(ROOT))
        for p in ROOT.rglob("*")
        if p.is_file() and ".git" not in p.parts
    ]

secret_markers = [
    re.compile(r"-----BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY-----"),
    re.compile(r"gh[pousr]_[A-Za-z0-9]{24,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{25,}"),
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{20,}"),
]
speaker_prefix = re.compile(r"^[^a-zA-Z\d\s]{0,4}\s*[A-Z][A-Z0-9_-]{1,24} SAYS\s*:", re.MULTILINE)

for path in tracked:
    item = ROOT / path
    if not item.is_file() or item.stat().st_size > 1_000_000:
        continue
    try:
        data = item.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    for marker in secret_markers:
        if marker.search(data):
            errors.append(f"Potential secret in tracked file: {path}")
    if path.endswith((".md", ".txt")) and speaker_prefix.search(data):
        errors.append(f"Private agent speaker prefix in public file: {path}")

# Links in the README must resolve to a real local file, except URL/anchor links.
for target in re.findall(r"!?\[[^\]]*]\(([^)]+)\)", readme):
    target = target.split("#", 1)[0].split("?", 1)[0].strip()
    if not target or "://" in target or target.startswith(("mailto:", "#", "/")):
        continue
    if not (ROOT / target).exists():
        errors.append(f"Broken local README link: {target}")

if errors:
    for error in errors:
        print(f"FAIL: {error}", file=sys.stderr)
    sys.exit(1)
print(f"PASS: public hygiene and documentation checks for {VERSION}")
print("NOTE: These checks do NOT establish that Switch or the Council workflow runs.")
