#!/usr/bin/env python3
"""Deterministic builder and packager for Mattermost 12.0.1 WebApp plugin (com.switch.council-chamber).

Produces:
1. mattermost-plugin-council/webapp/dist/main.js
2. mattermost-plugin-council/dist/com.switch.council-chamber-0.1.0.tar.gz
3. Copies webapp bundle to ui/plugin-bundle.js (or council-room-ui/plugin-bundle.js) for local browser harness.
"""

import gzip
import hashlib
import io
import json
import os
import shutil
import sys
import tarfile

sys.stdout.reconfigure(encoding='utf-8')

PLUGIN_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(PLUGIN_DIR)
MANIFEST_PATH = os.path.join(PLUGIN_DIR, "plugin.json")
SRC_INDEX = os.path.join(PLUGIN_DIR, "webapp", "src", "index.js")
DIST_WEBAPP_DIR = os.path.join(PLUGIN_DIR, "webapp", "dist")
DIST_PKG_DIR = os.path.join(PLUGIN_DIR, "dist")

def build():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    plugin_id = manifest["id"]
    version = manifest["version"]

    with open(SRC_INDEX, "r", encoding="utf-8") as f:
        src_js = f.read()

    os.makedirs(DIST_WEBAPP_DIR, exist_ok=True)
    os.makedirs(DIST_PKG_DIR, exist_ok=True)

    banner = (
        f"/*! Mattermost WebApp Plugin Bundle: {plugin_id} v{version} "
        f"(min_server_version: {manifest['min_server_version']}) */\n"
    )
    bundle_content = banner + src_js

    bundle_out = os.path.join(DIST_WEBAPP_DIR, "main.js")
    with open(bundle_out, "w", encoding="utf-8") as f:
        f.write(bundle_content)

    sha256_bundle = hashlib.sha256(bundle_content.encode("utf-8")).hexdigest()

    # Copy bundle into UI directory for local browser harness mounting
    for ui_candidate in ["ui", "council-room-ui"]:
        ui_dir = os.path.join(REPO_ROOT, ui_candidate)
        if os.path.isdir(ui_dir):
            shutil.copy2(bundle_out, os.path.join(ui_dir, "plugin-bundle.js"))

    # Deterministic, self-contained Mattermost .tar.gz (no filesystem/clock metadata).
    # Mattermost expects the plugin ID as the single archive root.
    tar_filename = f"{plugin_id}-{version}.tar.gz"
    tar_path = os.path.join(DIST_PKG_DIR, tar_filename)
    entries = (
        (MANIFEST_PATH, f"{plugin_id}/plugin.json"),
        (bundle_out, f"{plugin_id}/webapp/dist/main.js"),
    )

    with open(tar_path, "wb") as archive:
        with gzip.GzipFile(filename="", mode="wb", fileobj=archive,
                           compresslevel=9, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w", format=tarfile.USTAR_FORMAT) as tar:
                for source_path, member_name in entries:
                    payload = open(source_path, "rb").read()
                    member = tarfile.TarInfo(name=member_name)
                    member.size = len(payload)
                    member.mtime = 0
                    member.mode = 0o644
                    member.uid = member.gid = 0
                    member.uname = member.gname = ""
                    tar.addfile(member, io.BytesIO(payload))

    with open(tar_path, "rb") as archive:
        sha256_tar = hashlib.sha256(archive.read()).hexdigest()

    print(f"[BUILD PASS] Plugin ID: {plugin_id} v{version}")
    print(f"  WebApp Bundle: {bundle_out} ({len(bundle_content)} bytes, sha256={sha256_bundle[:16]})")
    print(f"  Plugin Archive: {tar_path} ({os.path.getsize(tar_path)} bytes, sha256={sha256_tar})")
    return 0

if __name__ == "__main__":
    sys.exit(build())
