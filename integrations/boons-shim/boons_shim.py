#!/usr/bin/env python3
"""Custom Switch agent client (Boons).

Minimal Switch agent client: server-sent events down, HTTP up, bearer
token from the environment. Python standard library only.

Protocol behavior:
  - GET /agents/{agent_id}/events with Accept: text/event-stream.
    Query: connection_id, scope, filter, and rooms when a room is set.
    connection_id is a UUID generated once and reused across reconnects.
  - Heartbeats start only after an SSE connection_state event.
    POST /agents/{agent_id}/connection/beat with JSON
    {"connection_id", "cursor"} every 2 seconds (server TTL 6 seconds).
    HTTP 404 or 409 means reopen the stream, not back off.
  - POST /agents/{agent_id}/message {"room_id", "content"} does not
    require an open stream.
  - POST /ops/{name} sends header x-switch-connection-id. Arguments
    are the JSON body, unwrapped.
  - Registration is out of band. This client never calls
    register-known and never contains an API key.

Environment (set on the host that runs the session; never commit values):
  SWITCH_BASE_URL
  SWITCH_AGENT_ID
  SWITCH_API_KEY
  SWITCH_ROOM_ID
  SWITCH_CONNECTION_ID   optional
  SWITCH_STATE_FILE      optional; default is a gitignored file beside
                         this script

Live room credentials are never committed.

Usage:
  boons_shim.py health
  boons_shim.py probe
  boons_shim.py post "text"
  boons_shim.py stream [--seconds N]
  boons_shim.py op NAME [JSON]
"""
import json
import os
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from urllib.parse import urlencode

BASE = os.environ.get("SWITCH_BASE_URL", "").rstrip("/")
AGENT_ID = os.environ.get("SWITCH_AGENT_ID", "")
API_KEY = os.environ.get("SWITCH_API_KEY", "")
ROOM_ID = os.environ.get("SWITCH_ROOM_ID", "")
STATE_FILE = os.environ.get(
    "SWITCH_STATE_FILE",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "boons_shim_state.json"),
)


def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def save_state(state):
    fd = os.open(STATE_FILE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2)
        handle.write("\n")


def connection_id():
    state = load_state()
    cid = state.get("connection_id") or os.environ.get("SWITCH_CONNECTION_ID")
    if not cid:
        cid = str(uuid.uuid4())
        state["connection_id"] = cid
        save_state(state)
    return cid


def request(method, path, body=None, headers=None, timeout=30):
    if not BASE:
        raise SystemExit("SWITCH_BASE_URL is not set")
    req = urllib.request.Request(BASE + path, method=method)
    if API_KEY:
        req.add_header("Authorization", "Bearer " + API_KEY)
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=data, timeout=timeout) as resp:
            raw = resp.read().decode(errors="replace")
            try:
                return resp.status, json.loads(raw)
            except ValueError:
                return resp.status, raw
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            return exc.code, json.loads(raw)
        except ValueError:
            return exc.code, raw
    except Exception as exc:  # noqa: BLE001 — surface blocked egress as data
        # Direct TCP to the Switch host can be blocked from a cloud sandbox.
        # Return that as a result instead of a traceback.
        return 0, {"error": type(exc).__name__, "detail": str(exc)}


def cmd_health():
    status, body = request("GET", "/health")
    print(json.dumps({"health_status": status, "body": body}))
    return 0 if status == 200 else 1


def cmd_probe():
    cmd_health()
    status, body = request("GET", "/agents")
    print(json.dumps({"agents_status": status, "agents_body": body}))
    return 0


def cmd_post(text):
    if not API_KEY or not AGENT_ID or not ROOM_ID:
        raise SystemExit("post needs SWITCH_API_KEY, SWITCH_AGENT_ID and SWITCH_ROOM_ID")
    status, body = request(
        "POST",
        "/agents/%s/message" % AGENT_ID,
        {"room_id": ROOM_ID, "content": text},
    )
    print(json.dumps({"status": status, "body": body}))
    return 0 if status == 200 else 1


def cmd_op(name, args=None):
    if not API_KEY:
        raise SystemExit("op needs SWITCH_API_KEY")
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", name or ""):
        raise SystemExit("op name must be a single token")
    status, body = request(
        "POST",
        "/ops/" + name,
        args or {},
        headers={"x-switch-connection-id": connection_id()},
    )
    print(json.dumps({"status": status, "body": body}))
    return 0 if status == 200 else 1


class Heartbeat(threading.Thread):
    """Beat every 2s after connection_state. On 404/409, reopen."""

    def __init__(self, cursor_getter, on_reopen):
        super().__init__(daemon=True)
        self.cursor_getter = cursor_getter
        self.on_reopen = on_reopen
        self.stop = threading.Event()
        self.reopen = False

    def run(self):
        while not self.stop.is_set():
            status, _body = request(
                "POST",
                "/agents/%s/connection/beat" % AGENT_ID,
                {"connection_id": connection_id(), "cursor": self.cursor_getter()},
            )
            if status in (404, 409):
                print("heartbeat: %s, reopen stream" % status, flush=True)
                self.reopen = True
                self.stop.set()
                self.on_reopen()
                return
            if self.stop.wait(2):
                return


def is_connection_state(event_name, data_text):
    """True when this SSE event is the connection_state that arms heartbeats."""
    if event_name and event_name.strip().lower() == "connection_state":
        return True
    if not data_text:
        return False
    try:
        payload = json.loads(data_text)
    except ValueError:
        return False
    if not isinstance(payload, dict):
        return False
    for key in ("type", "event", "state"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip().lower() == "connection_state":
            return True
    return False


def _events_url():
    query = {
        "connection_id": connection_id(),
        "scope": "all",
        "filter": "all",
    }
    if ROOM_ID:
        query["rooms"] = ROOM_ID
    return "%s/agents/%s/events?%s" % (BASE, AGENT_ID, urlencode(query))


def _stream_once(deadline):
    req = urllib.request.Request(_events_url())
    req.add_header("Authorization", "Bearer " + API_KEY)
    req.add_header("Accept", "text/event-stream")
    cursor = [0]
    hb = {"thread": None}
    holder = {"resp": None}
    event_name = None
    data_lines = []

    def close_resp():
        resp = holder.get("resp")
        if resp is not None:
            try:
                resp.close()
            except OSError:
                pass

    def ensure_heartbeat():
        if hb["thread"] is not None:
            return
        thread = Heartbeat(lambda: cursor[0], close_resp)
        hb["thread"] = thread
        thread.start()

    def reopen_requested():
        thread = hb["thread"]
        return thread is not None and thread.reopen

    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            holder["resp"] = resp
            print("stream status:", resp.status, flush=True)
            while time.time() < deadline:
                if reopen_requested():
                    return "reopen"
                try:
                    raw = resp.readline()
                except (TimeoutError, socket.timeout):
                    continue
                except urllib.error.URLError as exc:
                    if reopen_requested():
                        return "reopen"
                    reason = getattr(exc, "reason", None)
                    if isinstance(reason, (TimeoutError, socket.timeout)):
                        continue
                    print("stream error:", type(exc).__name__, str(exc)[:300], flush=True)
                    return "error"
                if raw == b"":
                    if reopen_requested():
                        return "reopen"
                    break
                text = raw.decode(errors="replace").rstrip("\r\n")
                if text:
                    print(text, flush=True)
                if text == "":
                    if is_connection_state(event_name, "\n".join(data_lines)):
                        ensure_heartbeat()
                    event_name = None
                    data_lines = []
                    continue
                if text.startswith(":"):
                    continue
                if text.startswith("id:"):
                    try:
                        cursor[0] = int(text[3:].strip())
                    except ValueError:
                        pass
                elif text.startswith("event:"):
                    event_name = text[6:].strip()
                    if is_connection_state(event_name, ""):
                        ensure_heartbeat()
                elif text.startswith("data:"):
                    data_lines.append(text[5:].lstrip())
            if reopen_requested():
                return "reopen"
            return "done"
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        print("stream HTTP", exc.code, detail, flush=True)
        if exc.code in (404, 409) or reopen_requested():
            return "reopen"
        return "error"
    except Exception as exc:  # noqa: BLE001 — CLI reports the failure and stops
        if reopen_requested():
            return "reopen"
        print("stream error:", type(exc).__name__, str(exc)[:300], flush=True)
        return "error"
    finally:
        thread = hb["thread"]
        if thread is not None:
            thread.stop.set()


def cmd_stream(seconds=30):
    if not BASE:
        raise SystemExit("SWITCH_BASE_URL is not set")
    if not API_KEY or not AGENT_ID:
        raise SystemExit("stream needs SWITCH_API_KEY and SWITCH_AGENT_ID")
    deadline = time.time() + seconds
    while time.time() < deadline:
        outcome = _stream_once(deadline)
        if outcome != "reopen":
            return 0 if outcome == "done" else 1
        if time.time() >= deadline:
            return 0
        print("reopen stream", flush=True)
    return 0


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd = argv[0]
    if cmd == "health":
        return cmd_health()
    if cmd == "probe":
        return cmd_probe()
    if cmd == "post":
        return cmd_post(" ".join(argv[1:]) or "hello from boons shim")
    if cmd == "op":
        if len(argv) < 2:
            raise SystemExit("op needs a name")
        args = json.loads(argv[2]) if len(argv) > 2 else None
        return cmd_op(argv[1], args)
    if cmd == "stream":
        secs = 30
        if "--seconds" in argv:
            secs = int(argv[argv.index("--seconds") + 1])
        return cmd_stream(secs)
    print("unknown command:", cmd)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
