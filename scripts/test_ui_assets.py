#!/usr/bin/env python3
"""Test verification script for Council UI avatar assets and seats alignment."""

import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

UI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ui"))
AVATARS_DIR = os.path.join(UI_DIR, "avatars")
APP_JS = os.path.join(UI_DIR, "app.js")
INDEX_HTML = os.path.join(UI_DIR, "index.html")
STYLE_CSS = os.path.join(UI_DIR, "style.css")

print(f"Checking Council UI assets in: {UI_DIR}")

# 1. Check all required SVG avatars exist and are non-empty
expected_svgs = [
    "jay.svg", "buddy.svg", "cora.svg", "gem.svg",
    "finch.svg", "boons.svg", "allen.svg", "bucky.svg", "charlie.svg"
]

all_passed = True

print("\n--- 1. VECTOR AVATARS CHECK ---")
for svg in expected_svgs:
    path = os.path.join(AVATARS_DIR, svg)
    if os.path.exists(path):
        size = os.path.getsize(path)
        if size > 0:
            print(f"  [PASS] {svg} exists ({size} bytes)")
        else:
            print(f"  [FAIL] {svg} is empty!")
            all_passed = False
    else:
        print(f"  [FAIL] {svg} is missing!")
        all_passed = False

# 2. Check raster photo assets
print("\n--- 2. RASTER PORTRAIT CHECK ---")
gem_png = os.path.join(AVATARS_DIR, "gem.png")
if os.path.exists(gem_png) and os.path.getsize(gem_png) > 0:
    print(f"  [PASS] gem.png exists ({os.path.getsize(gem_png)} bytes)")
else:
    print(f"  [FAIL] gem.png missing or empty!")
    all_passed = False

# 3. Check app.js seat definitions
print("\n--- 3. SEATS DEFINITION & REGISTRY ALIGNMENT ---")
with open(APP_JS, "r", encoding="utf-8") as f:
    app_js_text = f.read()

for persona in ["jay", "buddy", "cora", "gem", "finch", "boons", "allen", "bucky", "charlie"]:
    if f'id: "{persona}"' in app_js_text:
        print(f"  [PASS] Persona '{persona}' found in SEATS")
    else:
        print(f"  [FAIL] Persona '{persona}' missing in SEATS!")
        all_passed = False

# 4. Check profile modal DOM elements in index.html
print("\n--- 4. PROFILE INSPECTOR MODAL DOM CHECK ---")
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

# 5. Check CSS accessibility & modal rules
print("\n--- 5. CSS ACCESSIBILITY & MODAL STYLES CHECK ---")
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
    print("\nOVERALL: ALL 5 UI & AVATAR INTEGRITY GATES PASSED! (0 errors)")
    sys.exit(0)
else:
    print("\nOVERALL: GATES FAILED!")
    sys.exit(1)
