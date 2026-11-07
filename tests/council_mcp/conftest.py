"""All IDs, origins and credentials here are synthetic. No live services/model calls."""
import sys
from pathlib import Path
from dataclasses import replace
import httpx
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "integrations/council-mcp"))
from config import Settings
from core import Council

CHANNEL = "c" * 26
READER = "r" * 26
SENDER = "s" * 26
HUMAN = "h" * 26
SOURCE = "p" * 26
FOREIGN = "f" * 26
CORE_SENDER = "seat:buddy"
EVENT_ID = "sw_" + "a" * 32
FORGED_EVENT_ID = "sw_" + "b" * 32


@pytest.fixture
def settings(tmp_path):
    return Settings(mm_url="https://mm.example", switch_url="https://switch.example",
                    channel_id=CHANNEL, reader_user_id=READER, sender_user_id=SENDER,
                    human_user_ids=(HUMAN,), room_id="00000000-0000-4000-8000-000000000001",
                    agent_id="00000000-0000-4000-8000-000000000002",
                    mm_token="synthetic-reader-credential", switch_token="synthetic-seat-credential",
                    state_file=str(tmp_path / "receipts.sqlite"), writes_enabled=True,
                    seat="buddy", core_sender_id=CORE_SENDER, runtime_label="Buddy Main")


class Upstream:
    def __init__(self, settings):
        self.s = settings
        self.channel_type = "P"
        self.reader = READER
        self.posts = {SOURCE: dict(id=SOURCE, channel_id=CHANNEL, user_id=HUMAN,
                                   message="Human mission: test relay", create_at=1, delete_at=0, type="")}
        self.sent = []
        self.core_events = []
        self.requests = []
        self.fail_send = False
        self.bad_event_id = False
        self.override = None
        self._seq = 0

    async def __call__(self, request):
        self.requests.append(request)
        if self.override:
            result = self.override(request)
            if result is not None:
                return result
        path = request.url.path
        expected = self.s.switch_token if request.url.host == "switch.example" else self.s.mm_token
        assert request.headers["Authorization"] == "Bearer " + expected
        if path.endswith("/users/me"):
            data = {"id": self.reader}
        elif path == "/api/v4/channels/" + CHANNEL:
            data = {"id": CHANNEL, "type": self.channel_type, "name": "council"}
        elif path == "/api/v4/channels/" + CHANNEL + "/posts":
            ids = list(reversed(self.posts))[:int(request.url.params["per_page"])]
            data = {"order": ids, "posts": self.posts}
        elif path.startswith("/api/v4/posts/"):
            data = self.posts.get(path.rsplit("/", 1)[1])
            if data is None:
                return httpx.Response(404)
        elif path == "/agents/" + self.s.agent_id + "/message" and request.method == "POST":
            import json
            body = json.loads(request.content)
            assert body["room_id"] == self.s.room_id
            self.sent.append(body)
            if self.fail_send:
                raise httpx.ReadTimeout("simulated lost reply containing a secret", request=request)
            self._seq += 1
            event_id = "not-a-core-event" if self.bad_event_id else "sw_" + f"{self._seq:032x}"
            if not self.bad_event_id:
                self.core_events.append({
                    "id": event_id, "kind": "message", "sender": CORE_SENDER, "sender_name": "buddy",
                    "body": body["content"], "timestamp": 1_700_000_000_000 + self._seq,
                })
            data = {"ok": True, "event_id": event_id}
        elif path == "/agents/" + self.s.agent_id + "/ops/read_context" and request.method == "POST":
            import json
            body = json.loads(request.content)
            assert body["room_id"] == self.s.room_id
            assert 1 <= body["limit"] <= 50
            data = {"result": {
                "threads": [{"root": event, "replies": []} for event in self.core_events],
                "truncated": False, "oldest_timestamp": 1_700_000_000_000,
            }}
        else:
            raise AssertionError("Unexpected route: " + path)
        return httpx.Response(200, json=data)


@pytest.fixture
def rig(settings):
    backend = Upstream(settings)
    client = httpx.AsyncClient(transport=httpx.MockTransport(backend), follow_redirects=False)
    return Council(settings, client), backend
