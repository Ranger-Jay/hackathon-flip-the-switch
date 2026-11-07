#!/usr/bin/env python3
'''Unified end-to-end verification runner for the Switch Council Chamber UI/UX suite.'''

import os
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IS_PUBLIC_REPO = os.path.exists(os.path.join(SCRIPT_DIR, "verify_repo.py"))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

SUITES = []
if IS_PUBLIC_REPO:
    SUITES.append(("Public Hygiene & Orocue Gate", [sys.executable, os.path.join(SCRIPT_DIR, "verify_repo.py")]))

SUITES.extend([
    ("Avatar Portraits, Fallbacks & JSON Schema Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_ui_assets.py")]),
    ("Accessibility, Focus Trap, Reduced Motion & XSS Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_ui_hardening.py")]),
    ("Mattermost 12.0.1 WebApp Plugin Shell Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_mm_plugin.py")]),
    ("Event Adapter, Honest 7-State & Safe Renderer Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_event_adapter.py")]),
    ("Live History Bridge Core-ID & Provenance Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_live_bridge.py")]),
    ("Vercel Static Frontend & Asset Packaging Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_vercel_static_config.py")]),
    ("Evidence & Decision Panel & Truthful Human Gate", [sys.executable, os.path.join(SCRIPT_DIR, "test_evidence_panel.py")]),
    ("Headless Chrome 5-Viewport Matrix & Screenshot Gate", ["node", os.path.join(SCRIPT_DIR, "test_browser_matrix.js")]),
])

print("=====================================================================")
print("  SWITCH COUNCIL CHAMBER — FULL UI/UX VERIFICATION RUNNER (9 SUITES)")
print("=====================================================================")

failed = []
for name, cmd in SUITES:
    print(f"\n>>> Running: {name}")
    res = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True, encoding="utf-8")
    if res.returncode == 0:
        print(f"    [PASS] {name}")
    else:
        print(f"    [FAIL] {name} (exit {res.returncode})")
        print(res.stdout)
        print(res.stderr)
        failed.append(name)

print("\n=====================================================================")
if failed:
    print(f"OVERALL RESULT: FAILED ({len(failed)} suites failed: {failed})")
    sys.exit(1)
else:
    print(f"OVERALL RESULT: ALL {len(SUITES)}/{len(SUITES)} VERIFICATION SUITES PASSED CLEANLY!")
    sys.exit(0)
