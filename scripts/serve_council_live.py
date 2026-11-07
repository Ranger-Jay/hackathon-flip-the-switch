#!/usr/bin/env python3
'''Read-Only Live Council Bridge Server for Switch Council Chamber UI.

Serves the Council Chamber UI and exposes a read-only `/api/council/live-history`
endpoint that proxies room history from Switch Core without exposing agent tokens
to the browser bundle.
'''

import hashlib
import http.server
import json
import os
import re
import socketserver
import sys
import time
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
UI_DIR = SCRIPT_DIR if os.path.exists(os.path.join(SCRIPT_DIR, "index.html")) else os.path.abspath(os.path.join(SCRIPT_DIR, "..", "ui"))
PORT = int(os.environ.get("COUNCIL_UI_PORT", "8765"))

ROLE_LABELS = {
    "jay": ("Jay (Human Lead):", "Human Authority (Mattermost Web)", "human_authority"),
    "buddy": ("Buddy (Architect & Conductor):", "Direct-Seat Council MCP", "direct_seat_mcp"),
    "cora": ("Cora (Operations Lead & Commander):", "One-Seat Helper (Mode A)", "mode_a_oneseat_helper"),
    "gem": ("Gem (Creative & UX Lead):", "Native Antigravity Host (Pattern B)", "pattern_b_own_runtime"),
    "finch": ("Finch (Runtime & Verification Lead):", "Direct-Seat Council MCP (Codex)", "direct_seat_mcp"),
    "boons": ("Boons (Bridge & Integration Lead):", "Own-Runtime Bridge (Pattern B)", "pattern_b_own_runtime"),
    "allen": ("Allen (Engineering Squad Lead):", "One-Seat Helper (Mode A)", "mode_a_oneseat_helper"),
    "bucky": ("Bucky (Intelligence & Evidence Auditor):", "One-Seat Helper (Mode A)", "mode_a_oneseat_helper"),
    "charlie": ("Charlie (Creatives & Product Squad Lead):", "One-Seat Helper (Mode A)", "mode_a_oneseat_helper"),
}


def discover_config():
    core_url = os.environ.get("SWITCH_CORE_URL")
    room_id = os.environ.get("SWITCH_ROOM_ID")
    priv_cfg_candidates = [
        os.path.join(UI_DIR, "config.private.json"),
        os.path.abspath(os.path.join(UI_DIR, "..", "..", "switch-private", "council-room-ui", "config.private.json")),
    ]
    for p in priv_cfg_candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                if not core_url:
                    core_url = cfg.get("switch_core_base_url")
                if not room_id:
                    room_id = cfg.get("switch_room_id")
            except Exception:
                pass
    if not core_url:
        core_url = "http://localhost:8000"

    creds_candidates = [
        os.environ.get("SWITCH_CREDS_FILE"),
        os.path.abspath(os.path.join(UI_DIR, "..", "..", "scratch", "switch_gem_creds.json")),
        os.path.expanduser("~/.switch_creds/.switch_gem_agent_creds.json"),
        "/home/allen/.switch_creds/.switch_gem_agent_creds.json",
    ]
    agent_id = None
    api_key = None
    for cp in creds_candidates:
        if cp and os.path.exists(cp):
            try:
                with open(cp, "r", encoding="utf-8") as f:
                    c = json.load(f)
                agent_id = c.get("id") or c.get("agent_id")
                api_key = c.get("api_key")
                if agent_id and api_key:
                    break
            except Exception:
                pass
    return core_url.rstrip("/"), room_id, agent_id, api_key


def normalize_live_event(raw_ev, idx):
    raw_sender = str(raw_ev.get("sender_name") or raw_ev.get("sender") or "unknown").lower().strip()
    if raw_sender in ("user", "jay", "ranger-jay"):
        seat_id = "jay"
    else:
        seat_id = raw_sender
        for k in ROLE_LABELS:
            if k in raw_sender:
                seat_id = k
                break

    body = str(raw_ev.get("body") or raw_ev.get("content") or "").strip()
    ts = int(raw_ev.get("timestamp") or raw_ev.get("created_at") or int(time.time() * 1000))

    sw_match = re.search(r"\b(sw_[0-9a-fA-F]{16,64})\b", body)
    if raw_ev.get("event_id") or raw_ev.get("id"):
        event_id = str(raw_ev.get("event_id") or raw_ev.get("id"))
    elif sw_match:
        event_id = sw_match.group(1)
    else:
        digest = hashlib.sha256(f"{seat_id}:{ts}:{body}".encode("utf-8")).hexdigest()[:16]
        event_id = f"sw_{digest}"

    prefix, runtime_label, exec_mode = ROLE_LABELS.get(
        seat_id, (f"{seat_id.capitalize()}:", "Switch Seat", "live_room_event")
    )
    return {
        "event_id": event_id,
        "mm_post_id": raw_ev.get("mm_post_id") or event_id,
        "sender_id": seat_id,
        "sender_name": seat_id,
        "prefix": prefix,
        "runtime_label": runtime_label,
        "execution_mode": exec_mode,
        "event_type": "live_message",
        "content": body,
        "timestamp": ts,
        "own_seat": True,
        "source_verified_link": True,
        "provenance": "LIVE_EVENT"
    }


def fetch_switch_core_history(limit=40):
    core_url, room_id, agent_id, api_key = discover_config()
    if not room_id or not agent_id or not api_key:
        return {"ok": False, "status": 401, "error": "Host observer credentials or room_id not configured on disk."}

    url = f"{core_url}/agents/{agent_id}/rooms/{room_id}/history?limit={limit}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"})
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=6) as resp:
            latency_ms = round((time.time() - t0) * 1000, 1)
            payload = json.loads(resp.read().decode("utf-8"))
            raw_events = payload.get("events") or payload.get("messages") or []
            normalized = [normalize_live_event(ev, idx) for idx, ev in enumerate(raw_events)]
            return {
                "ok": True,
                "status": 200,
                "verified_by_host_proxy": True,
                "latency_ms": latency_ms,
                "fetched_at": int(time.time() * 1000),
                "count": len(normalized),
                "events": normalized
            }
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "error": f"Switch Core HTTP {e.code}"}
    except Exception as e:
        return {"ok": False, "status": 503, "error": f"Switch Core unreachable: {e}"}


class CouncilLiveHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=UI_DIR, **kwargs)

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        clean_path = self.path.split("?")[0]
        if clean_path == "/api/council/live-history":
            result = fetch_switch_core_history(limit=40)
            code = 200 if result.get("ok") else int(result.get("status") or 503)
            body = json.dumps(result).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), CouncilLiveHandler) as httpd:
        print(f"Switch Council Chamber Live Server listening on http://127.0.0.1:{PORT}")
        print(f"Serving UI from: {UI_DIR}")
        sys.stdout.flush()
        httpd.serve_forever()
