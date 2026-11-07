#!/usr/bin/env python3
"""Automated build and contract test suite for Mattermost 12.0.1 WebApp Plugin (Slice 2)."""

import hashlib
import json
import os
import subprocess
import sys
import tarfile
import time

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(SCRIPT_DIR, "app.js")):
    REPO_ROOT = os.path.dirname(SCRIPT_DIR)
    UI_DIR = SCRIPT_DIR
else:
    REPO_ROOT = os.path.dirname(SCRIPT_DIR)
    UI_DIR = os.path.join(REPO_ROOT, "ui")

PLUGIN_DIR = os.path.join(REPO_ROOT, "mattermost-plugin-council")
BUILD_SCRIPT = os.path.join(PLUGIN_DIR, "build_plugin.py")

print(f"=== MATTERMOST 12.0.1 PLUGIN BUILD & CONTRACT SUITE ({PLUGIN_DIR}) ===")
all_passed = True

# 1. Run build_plugin.py
res = subprocess.run([sys.executable, BUILD_SCRIPT], capture_output=True, text=True, encoding="utf-8")
if res.returncode == 0:
    print("  [PASS] build_plugin.py compiled bundle and packaged tar.gz archive")
else:
    print(f"  [FAIL] build_plugin.py failed:\n{res.stdout}\n{res.stderr}")
    sys.exit(1)

# 2. Verify plugin.json manifest
with open(os.path.join(PLUGIN_DIR, "plugin.json"), "r", encoding="utf-8") as f:
    manifest = json.load(f)

if manifest.get("id") == "com.switch.council-chamber" and manifest.get("min_server_version") == "12.0.0":
    print("  [PASS] plugin.json manifest valid (id=com.switch.council-chamber, min_server_version=12.0.0)")
else:
    print("  [FAIL] plugin.json manifest invalid")
    all_passed = False

# 3. Verify tar.gz archive contents
tar_path = os.path.join(PLUGIN_DIR, "dist", "com.switch.council-chamber-0.1.0.tar.gz")
if os.path.exists(tar_path):
    with tarfile.open(tar_path, "r:gz") as tar:
        names = tar.getnames()
    expected = {"com.switch.council-chamber/plugin.json", "com.switch.council-chamber/webapp/dist/main.js"}
    if expected.issubset(set(names)):
        print(f"  [PASS] Archive contains required entries: {sorted(names)}")
    else:
        print(f"  [FAIL] Archive missing expected entries: {names}")
        all_passed = False
else:
    print("  [FAIL] Plugin tar.gz archive not found")
    all_passed = False

# 3a. Reproducibility and safety: archive must be identical across different
# wall-clock seconds and contain only two regular, normalized plugin files.
with open(tar_path, "rb") as f:
    first_digest = hashlib.sha256(f.read()).hexdigest()
time.sleep(1.05)
res_second = subprocess.run([sys.executable, BUILD_SCRIPT], capture_output=True, text=True, encoding="utf-8")
if res_second.returncode != 0:
    print(f"  [FAIL] Deterministic rebuild errored: {res_second.stdout} {res_second.stderr}")
    all_passed = False
else:
    with open(tar_path, "rb") as f:
        second_digest = hashlib.sha256(f.read()).hexdigest()
    if first_digest == second_digest:
        print(f"  [PASS] Reproducible archive hash unchanged across 1+ second: sha256={second_digest}")
    else:
        print(f"  [FAIL] Archive hash changes across builds: {first_digest} != {second_digest}")
        all_passed = False

with tarfile.open(tar_path, "r:gz") as tar:
    members = tar.getmembers()
    allowed = {
        "com.switch.council-chamber/plugin.json",
        "com.switch.council-chamber/webapp/dist/main.js",
    }
    if (len(members) != 2 or any(not m.isfile() or m.name not in allowed or
            m.mtime != 0 or m.uid != 0 or m.gid != 0 for m in members)):
        print("  [FAIL] Archive contains unsafe/unexpected entries or variable metadata")
        all_passed = False
    else:
        print("  [PASS] Archive content exactly matches 2 safe normalized files")

# 4. Verify Mattermost 12.0.1 PluginRegistry hooks in compiled bundle
bundle_path = os.path.join(UI_DIR, "plugin-bundle.js")
with open(bundle_path, "r", encoding="utf-8") as f:
    bundle_js = f.read()

required_hooks = [
    "window.registerPlugin",
    "registerReducer",
    "registerRightHandSidebarComponent",
    "registerChannelHeaderButtonAction",
    "registerRootComponent",
    "registerPostActionComponent",
    "registerWebSocketEventHandler",
]
for h in required_hooks:
    if h in bundle_js:
        print(f"  [PASS] Bundle implements Mattermost 12.0.1 hook: {h}")
    else:
        print(f"  [FAIL] Bundle missing hook: {h}")
        all_passed = False

# 5. Execute Node VM mount simulation to verify runtime registration & Redux state dispatch
node_test = """
const vm = require('vm');
const fs = require('fs');
const code = fs.readFileSync(process.argv[1], 'utf8');

let registeredId = null;
let pluginObj = null;
const windowMock = {
  React: { createElement: (t, p, ...c) => ({ type: t, props: p, children: c }) },
  registerPlugin: (id, inst) => { registeredId = id; pluginObj = inst; }
};
const context = vm.createContext({ window: windowMock, console, Date, Object, Array, Boolean, String });
vm.runInContext(code, context);

if (registeredId !== 'com.switch.council-chamber' || !pluginObj) {
  console.error('Plugin failed to call window.registerPlugin');
  process.exit(1);
}

let state = {
  entities: {
    channels: { currentChannelId: 'c1', channels: { c1: { name: 'council', display_name: 'switch/council' } } },
    users: { currentUserId: 'u1', profiles: { u1: { roles: 'system_admin' } } },
    posts: { posts: { p1: { id: 'p1', channel_id: 'c1', create_at: 100, message: 'test' } } }
  }
};
let reducerFn = null;
const storeMock = {
  getState: () => state,
  dispatch: (act) => {
    if (reducerFn && act && act.type) {
      state['plugins-com.switch.council-chamber'] = reducerFn(state['plugins-com.switch.council-chamber'], act);
    }
  }
};
const registryMock = {
  registerReducer: (r) => { reducerFn = r; state['plugins-com.switch.council-chamber'] = r(undefined, { type: '@@INIT' }); },
  registerRightHandSidebarComponent: (c, t) => ({ id: 'rhs1', showRHSPlugin: { type: 'SHOW' }, toggleRHSPlugin: { type: 'TOGGLE' } }),
  registerChannelHeaderButtonAction: () => {},
  registerRootComponent: (c) => { globalThis.__capturedRootComp = c; },
  registerPostActionComponent: () => {},
  registerWebSocketEventHandler: () => {}
};

pluginObj.initialize(registryMock, storeMock);
if (!pluginObj.registeredHooks.rhs || !pluginObj.registeredHooks.rootComponent || pluginObj.registeredHooks.channelHeaderButtons !== 2) {
  console.error('Hooks not registered properly:', pluginObj.registeredHooks);
  process.exit(1);
}
storeMock.dispatch({ type: 'com.switch.council-chamber/TOGGLE_CHAMBER' });
if (!state['plugins-com.switch.council-chamber'].isChamberOpen) {
  console.error('Reducer failed to toggle chamber state');
  process.exit(1);
}
// P1.5 Verify WebSocket 'posted' event ingestion into Redux store & channel context
storeMock.dispatch({
  type: 'com.switch.council-chamber/WS_EVENT',
  timestamp: Date.now(),
  event: { data: { post: JSON.stringify({ id: 'ws_post_99', channel_id: 'c1', sender_name: 'finch', create_at: 200, message: 'Live WS post' }) } }
});
const ctxAfterWs = windowMock.getCouncilChannelContextFromStore(storeMock);
if (ctxAfterWs.postsCount !== 2 || !ctxAfterWs.posts.some(p => p.id === 'ws_post_99')) {
  console.error('WebSocket posted event was not ingested into channel context:', ctxAfterWs);
  process.exit(1);
}
const rootCompFn = globalThis.__capturedRootComp;
const rootVdom = rootCompFn();
const rootJson = JSON.stringify(rootVdom);
if (!rootVdom || !rootJson.includes('mm-overlay-seat-node') || !rootJson.includes('9-SEAT COUNCIL RING') || rootJson.includes('Full 9-Seat Council Chamber Active')) {
  console.error('RootOverlayComponent did not render functional 9-seat React tree:', rootJson.slice(0, 300));
  process.exit(1);
}
console.log('NODE_VM_MOUNT_OK');
"""
node_res = subprocess.run(["node", "-e", node_test, bundle_path], capture_output=True, text=True, encoding="utf-8")
if node_res.returncode == 0 and "NODE_VM_MOUNT_OK" in node_res.stdout:
    print("  [PASS] Node VM runtime verification: registerPlugin, initialize(), 6 registry hooks, and Redux state reducer PASS")
else:
    print(f"  [FAIL] Node VM runtime verification failed: {node_res.stdout} {node_res.stderr}")
    all_passed = False

if all_passed:
    print("\nOVERALL: ALL MATTERMOST 12.0.1 PLUGIN SHELL GATES PASSED! (0 errors)")
    sys.exit(0)
else:
    print("\nOVERALL: PLUGIN GATES FAILED!")
    sys.exit(1)
