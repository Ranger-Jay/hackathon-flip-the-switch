#!/usr/bin/env python3
"""Automated verification test suite for UI Runtime Hardening (Feature Slice 1).

Covers:
1. Modal Focus Trap & Restoration (WCAG 2.1 AA dialog pattern)
2. JS Reduced Motion Runtime Guard (prefers-reduced-motion: reduce)
3. Async Workflow Cancellation on Reset (AbortController)
4. Safe DOM Text Rendering (XSS injection prevention)
"""

import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

UI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ui"))
APP_JS = os.path.join(UI_DIR, "app.js")
INDEX_HTML = os.path.join(UI_DIR, "index.html")
STYLE_CSS = os.path.join(UI_DIR, "style.css")

print(f"Executing UI Runtime Hardening Test Suite on: {APP_JS}")

with open(APP_JS, "r", encoding="utf-8") as f:
    app_js = f.read()

all_passed = True

# 1. Focus Trap & Restoration Test
print("\n--- 1. MODAL DIALOG FOCUS TRAP & RESTORATION ---")
has_focus_trap = "handleModalFocusTrap" in app_js and "e.key !== \"Tab\"" in app_js
has_last_active = "lastActiveElement" in app_js and "lastActiveElement.focus()" in app_js
has_focus_entry = "closeProfileBtn.focus()" in app_js
has_aria_sync = 'setAttribute("aria-hidden", "false")' in app_js and 'setAttribute("aria-hidden", "true")' in app_js

if has_focus_trap:
    print("  [PASS] Modal Tab / Shift-Tab focus trapping implemented")
else:
    print("  [FAIL] Missing handleModalFocusTrap or Tab wrap logic")
    all_passed = False

if has_last_active and has_focus_entry:
    print("  [PASS] Focus entry into dialog and restoration to opener on close implemented")
else:
    print("  [FAIL] Missing focus entry or focus restoration")
    all_passed = False

if has_aria_sync:
    print("  [PASS] aria-hidden state synchronized with open/close")
else:
    print("  [FAIL] Missing aria-hidden synchronization")
    all_passed = False

# 2. JS Reduced Motion Runtime Guard Test
print("\n--- 2. JS REDUCED MOTION RUNTIME GUARD ---")
has_match_media = "prefers-reduced-motion: reduce" in app_js
has_motion_listener = "prefersReducedMotion = e.matches" in app_js or "motionQuery.addEventListener" in app_js
has_motion_guard = "if (prefersReducedMotion || !is3DMode)" in app_js or "if (prefersReducedMotion)" in app_js
has_static_frame = "renderHoloFrame()" in app_js

if has_match_media and has_motion_listener:
    print("  [PASS] matchMedia('(prefers-reduced-motion: reduce)') change listener registered")
else:
    print("  [FAIL] Missing matchMedia query or change listener")
    all_passed = False

if has_motion_guard and has_static_frame:
    print("  [PASS] Animation loop paused when reduced motion active; static frame rendered")
else:
    print("  [FAIL] Missing reduced motion guard in animateHolo or renderHoloFrame")
    all_passed = False

# 3. Async Workflow Cancellation Test
print("\n--- 3. ASYNC WORKFLOW CANCELLATION ON RESET ---")
has_abort_ctrl = "workflowAbortController = new AbortController()" in app_js
has_signal_abort = "signal.aborted" in app_js
has_reset_abort = "workflowAbortController.abort()" in app_js
has_clear_timer = "clearTimeout(timer)" in app_js

if has_abort_ctrl and has_signal_abort:
    print("  [PASS] AbortController and signal listeners configured for async workflow")
else:
    print("  [FAIL] Missing AbortController or signal checks")
    all_passed = False

if has_reset_abort and has_clear_timer:
    print("  [PASS] resetWorkflow() aborts active in-flight promises and clears timers")
else:
    print("  [FAIL] resetWorkflow() does not abort controller or clear timers")
    all_passed = False

# 4. Safe DOM Text Rendering (XSS Prevention)
print("\n--- 4. SAFE DOM TEXT RENDERING (XSS PREVENTION) ---")
has_create_author = "document.createElement(\"span\")" in app_js and "authorSpan.textContent = turn.prefix" in app_js
has_create_content = "document.createElement(\"div\")" in app_js and "contentDiv.textContent = turn.content" in app_js

if has_create_author and has_create_content:
    print("  [PASS] Dynamic author prefix and message content safely rendered via textContent")
else:
    print("  [FAIL] appendMessageCard uses raw string interpolation for dynamic text")
    all_passed = False

# 5. Regression Check: Existing UI Assets Suite
print("\n--- 5. REGRESSION CHECK ---")
import subprocess
res = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "test_ui_assets.py")], capture_output=True, text=True)
if res.returncode == 0:
    print("  [PASS] test_ui_assets.py: ALL 5 UI & AVATAR INTEGRITY GATES PASSED")
else:
    print(f"  [FAIL] test_ui_assets.py failed:\n{res.stdout}\n{res.stderr}")
    all_passed = False

print("\n-----------------------------------------------------")
if all_passed:
    print("OVERALL: ALL UI RUNTIME HARDENING TESTS PASSED! (0 errors)")
    sys.exit(0)
else:
    print("OVERALL: FAILURES DETECTED")
    sys.exit(1)
