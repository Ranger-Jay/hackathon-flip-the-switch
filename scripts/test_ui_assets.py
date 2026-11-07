#!/usr/bin/env python3
"""Test verification script for Council UI avatar assets, contracts, and seats alignment."""

import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(SCRIPT_DIR, "app.js")):
    UI_DIR = SCRIPT_DIR
else:
    UI_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "ui"))

AVATARS_DIR = os.path.join(UI_DIR, "avatars")
CONTRACTS_DIR = os.path.join(UI_DIR, "contracts")
APP_JS = os.path.join(UI_DIR, "app.js")
INDEX_HTML = os.path.join(UI_DIR, "index.html")
STYLE_CSS = os.path.join(UI_DIR, "style.css")

print(f"Checking Council UI assets in: {UI_DIR}")

personas = ["jay", "buddy", "cora", "gem", "finch", "boons", "allen", "bucky", "charlie"]
all_passed = True

# 1. Check all 9 required SVG fallback avatars exist and are non-empty
print("\n--- 1. VECTOR FALLBACK AVATARS CHECK (9/9) ---")
for p in personas:
    svg = f"{p}.svg"
    path = os.path.join(AVATARS_DIR, svg)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        print(f"  [PASS] {svg} exists ({os.path.getsize(path)} bytes)")
    else:
        print(f"  [FAIL] {svg} missing or empty!")
        all_passed = False

# 2. Check all 9 local high-resolution PNG portraits exist and have valid PNG signature
print("\n--- 2. RASTER PORTRAITS CHECK (9/9 PNG) ---")
for p in personas:
    png = f"{p}.png"
    path = os.path.join(AVATARS_DIR, png)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        with open(path, "rb") as f:
            sig = f.read(8)
        if sig == b"\x89PNG\r\n\x1a\n":
            print(f"  [PASS] {png} valid PNG ({os.path.getsize(path)} bytes)")
        else:
            print(f"  [FAIL] {png} invalid PNG header!")
            all_passed = False
    else:
        print(f"  [FAIL] {png} missing or empty!")
        all_passed = False

# 3. Check canonical event contract schema
print("\n--- 3. EVENT ADAPTER CONTRACT SCHEMA CHECK ---")
schema_path = os.path.join(CONTRACTS_DIR, "council-event-schema.json")
if os.path.exists(schema_path):
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)
        defs = schema.get("definitions", {})
        required_defs = ["OperatingMode", "HonestSeatStatus", "ExecutionMode", "CouncilEvent", "RoleAssessment", "DecisionRecord"]
        missing_defs = [d for d in required_defs if d not in defs]
        if not missing_defs:
            print(f"  [PASS] council-event-schema.json valid with all {len(required_defs)} canonical definitions")
        else:
            print(f"  [FAIL] council-event-schema.json missing definitions: {missing_defs}")
            all_passed = False
    except Exception as e:
        print(f"  [FAIL] council-event-schema.json parse error: {e}")
        all_passed = False
else:
    print("  [FAIL] contracts/council-event-schema.json missing!")
    all_passed = False

# 4. Check app.js seat definitions
print("\n--- 4. SEATS DEFINITION & REGISTRY ALIGNMENT ---")
with open(APP_JS, "r", encoding="utf-8") as f:
    app_js_text = f.read()

for persona in personas:
    if f'id: "{persona}"' in app_js_text:
        print(f"  [PASS] Persona '{persona}' found in SEATS")
    else:
        print(f"  [FAIL] Persona '{persona}' missing in SEATS!")
        all_passed = False

# 5. Check profile modal DOM elements in index.html
print("\n--- 5. PROFILE INSPECTOR MODAL DOM CHECK ---")
with open(INDEX_HTML, "r", encoding="utf-8") as f:
    html_text = f.read()

required_ids = [
    "profileModalOverlay", "closeProfileBtn", "profileAvatarImg",
    "profileStatusIndicator", "profileEmoji", "profileName",
    "profileRuntime", "profileRole", "profileDesc",
    "profilePersonaId", "profileTransport", "profilePresence", "profileHash"
]

for dom_id in required_ids:
    if f'id="{dom_id}"' in html_text:
        print(f"  [PASS] DOM element #{dom_id} present")
    else:
        print(f"  [FAIL] DOM element #{dom_id} missing in index.html!")
        all_passed = False

# 6. Check CSS accessibility & modal rules
print("\n--- 6. CSS ACCESSIBILITY & MODAL STYLES CHECK ---")
with open(STYLE_CSS, "r", encoding="utf-8") as f:
    css_text = f.read()

required_selectors = [
    ".profile-modal-overlay", ".profile-card", ".profile-avatar-wrap",
    ".profile-status-indicator", ".seat-node:focus-visible",
    "prefers-reduced-motion"
]

for selector in required_selectors:
    if selector in css_text:
        print(f"  [PASS] CSS rule '{selector}' present")
    else:
        print(f"  [FAIL] CSS rule '{selector}' missing in style.css!")
        all_passed = False

if all_passed:
    print("\nOVERALL: ALL 6 UI, AVATAR & CONTRACT INTEGRITY GATES PASSED! (0 errors)")
    sys.exit(0)
else:
    print("\nOVERALL: GATES FAILED!")
    sys.exit(1)
