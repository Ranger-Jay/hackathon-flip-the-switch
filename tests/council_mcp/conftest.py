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


@pytest.fixture
def settings(tmp_path):
    return Settings(mm_url="https://mm.example", switch_url="https://switch.example",
                    channel_id=CHANNEL, reader_user_id=READER, sender_user_id=SENDER,
                    human_user_ids=(HUMAN,), room_id="00000000-0000-4000-8000-000000000001",
                    agent_id="00000000-0000-4000-8000-000000000002",
                    mm_token="synthetic-reader-credential", switch_token="synthetic-seat-credential",
                    state_file=str(tmp_path / "receipts.sqlite"), writes_enabled=True)


class Upstream:
    def __init__(self, settings):
        self.s = settings
        self.channel_type = "P"
        self.reader = READER
        self.posts = {SOURCE: dict(id=SOURCE, channel_id=CHANNEL, user_id=HUMAN,
                                   message="Human mission: test relay", create_at=1, delete_at=0, type="")}
        self.sent = []
        self.requests = []
        self.fail_send = False
        self.override = None

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
            self.sent.append(json.loads(request.content))
            if self.fail_send:
                raise httpx.ReadTimeout("simulated lost reply containing a secret", request=request)
            data = {"event_id": "synthetic-core-receipt"}
        else:
            raise AssertionError("Unexpected route: " + path)
        return httpx.Response(200, json=data)


@pytest.fixture
def rig(settings):
    backend = Upstream(settings)
    client = httpx.AsyncClient(transport=httpx.MockTransport(backend), follow_redirects=False)
    return Council(settings, client), backend
