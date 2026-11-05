"""Official SDK stdio client and HTTP JSON-RPC/auth contracts against synthetic upstreams."""
import asyncio
from dataclasses import replace
import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import time
from types import SimpleNamespace
import sys

from cryptography.hazmat.primitives.asymmetric import rsa
import httpx
import jwt
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.server.auth.provider import AccessToken, TokenVerifier
import pytest
from starlette.testclient import TestClient

from conftest import ROOT, CHANNEL, HUMAN, READER, SENDER, SOURCE, CORE_SENDER
from config import CouncilError
from server import create_server, OAuthVerifier, READ, WRITE


TOOLS = {"post_message", "read_history"}
REMOVED = {"council_identity", "council_read_recent", "council_post_reply", "council_receipt"}


@pytest.fixture
def remote(settings):
    return replace(settings, transport="streamable-http", public_url="https://council.example",
                   issuer_url="https://auth.example/realms/council/", jwks_url="https://auth.example/jwks",
                   subjects=("jay",), oauth_client_id="chatgpt-council-buddy")


@pytest.fixture
def signer(remote):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    jwks = SimpleNamespace(get_signing_key_from_jwt=lambda _token: SimpleNamespace(key=key.public_key()))
    verifier = OAuthVerifier(remote, jwks)
    def token(drop=(), **claims):
        payload = dict(iss=remote.issuer_url, aud=remote.resource, sub="jay", azp=remote.oauth_client_id,
                       iat=int(time.time()), exp=int(time.time()) + 300, scope=READ + " " + WRITE)
        payload.update(claims)
        for key_name in drop:
            payload.pop(key_name, None)
        return jwt.encode(payload, key, algorithm="RS256")
    return verifier, token


def test_real_jwt_signature_and_subject_resource_checks(signer):
    verifier, token = signer
    good = asyncio.run(verifier.verify_token(token()))
    assert good.subject == "jay" and WRITE in good.scopes
    assert good.client_id == "chatgpt-council-buddy"
    cases = [token(aud="https://foreign.example/mcp"), token(aud="chatgpt-council-buddy"),
             token(iss="https://other.example"), token(sub="other"), token(azp="council-finch"),
             token(drop=("azp",)), token(exp=int(time.time()) - 10), token(scope=WRITE),
             token(iat=int(time.time()) + 3600), "opaque-mattermost-token"]
    for value in cases:
        assert asyncio.run(verifier.verify_token(value)) is None
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    claims = jwt.decode(token(), options={"verify_signature": False})
    assert asyncio.run(verifier.verify_token(jwt.encode(claims, other, algorithm="RS256"))) is None


def rpc(client, method, params=None, token=None, request_id=1):
    headers = {"Accept": "application/json, text/event-stream", "MCP-Protocol-Version": "2025-11-25"}
    if token:
        headers["Authorization"] = "Bearer " + token
    return client.post("/mcp", json=dict(jsonrpc="2.0", id=request_id, method=method, params=params or {}), headers=headers)


def test_http_oauth_metadata_scopes_tool_schema_and_write(remote, rig, signer):
    council, backend = rig
    verifier, token = signer
    server = create_server(remote, council, verifier)
    app = server.streamable_http_app()
    with TestClient(app, base_url=remote.public_url) as client:
        denied = rpc(client, "tools/list")
        assert denied.status_code == 401 and "resource_metadata=" in denied.headers["www-authenticate"]
        metadata = client.get("/.well-known/oauth-protected-resource/mcp").json()
        assert metadata["resource"] == remote.resource
        assert set(metadata["scopes_supported"]) == {READ, WRITE}
        assert remote.issuer_url.rstrip("/") in [x.rstrip("/") for x in metadata["authorization_servers"]]
        assert client.get("/healthz").json()["live_upstream_verified"] is False
        init = rpc(client, "initialize", dict(protocolVersion="2025-11-25", capabilities={},
                                             clientInfo=dict(name="offline-test", version="1")), token())
        assert init.status_code == 200 and "result" in init.json()
        listed = rpc(client, "tools/list", token=token()).json()["result"]["tools"]
        assert {t["name"] for t in listed} == TOOLS
        assert all(t["inputSchema"]["additionalProperties"] is False for t in listed)
        write = next(t for t in listed if t["name"] == "post_message")
        assert not write["annotations"]["readOnlyHint"]
        assert not {"agent_id", "channel_id", "room_id", "url", "token", "seat"} & set(write["inputSchema"]["properties"])
        args = dict(source_post_id=SOURCE, message="HTTP MCP contract reply", request_id="http-request1")
        rejected = rpc(client, "tools/call", dict(name="post_message", arguments=args), token(scope=READ)).json()
        assert rejected["result"]["isError"] and not backend.sent
        posted = rpc(client, "tools/call", dict(name="post_message", arguments=args), token()).json()
        assert not posted["result"].get("isError") and len(backend.sent) == 1
        body = json.loads(posted["result"]["content"][0]["text"])
        assert body["event_id"].startswith("sw_") and body["sender"] == CORE_SENDER
        for name in REMOVED:
            removed = rpc(client, "tools/call", dict(name=name, arguments={}), token()).json()
            assert removed["result"]["isError"]
        evil = rpc(client, "tools/call", dict(name="post_message", arguments=args | {"seat": "finch"}), token()).json()
        assert evil["result"]["isError"]
        bad_host = client.post("/mcp", headers={"Host": "foreign.example", "Authorization": "Bearer " + token()}, json={})
        assert bad_host.status_code in (400, 403, 421)


def test_http_owned_client_survives_multiple_requests_and_closes_on_shutdown(remote, rig, signer, monkeypatch):
    import server as module
    council, _backend = rig
    verifier, token = signer
    monkeypatch.setattr(module, "Council", lambda _settings: council)
    service = create_server(remote, verifier=verifier)
    with TestClient(service.streamable_http_app(), base_url=remote.public_url) as client:
        for _ in range(2):
            response = rpc(client, "tools/call", dict(name="read_history", arguments={"limit": 1}), token()).json()
            assert not response["result"].get("isError"), response
            assert not council.client.is_closed
    assert council.client.is_closed


def test_http_requires_auth_configuration(settings):
    with pytest.raises(CouncilError):
        create_server(replace(settings, transport="streamable-http"))


def test_actual_sdk_stdio_client_through_loopback_upstreams(settings, tmp_path):
    sent = []
    events = [{
        "id": "sw_" + "d" * 32, "kind": "message", "sender": CORE_SENDER, "sender_name": "buddy",
        "body": "stdio nonce: synthetic-123", "timestamp": 1_700_000_000_000,
    }]
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            path = self.path.split("?")[0]
            if path.endswith("/users/me"):
                data = {"id": READER}
            elif path.endswith("/posts"):
                data = {"order": [SOURCE], "posts": {SOURCE: dict(id=SOURCE, channel_id=CHANNEL,
                        user_id=HUMAN, message="stdio nonce: synthetic-123", delete_at=0)}}
            elif path.startswith("/api/v4/posts/"):
                data = dict(id=SOURCE, channel_id=CHANNEL, user_id=HUMAN, message="test", delete_at=0)
            else:
                data = dict(id=CHANNEL, type="P", name="council")
            self.respond(data)

        def do_POST(self):
            raw = self.rfile.read(int(self.headers["Content-Length"] or 0))
            body = json.loads(raw or b"{}")
            if self.path.endswith("/ops/read_context"):
                assert body["room_id"] == settings.room_id
                self.respond({"result": {"threads": [{"root": event, "replies": []} for event in events],
                                         "truncated": False, "oldest_timestamp": 1_700_000_000_000}})
                return
            assert self.path == "/agents/" + settings.agent_id + "/message"
            assert self.headers["Authorization"] == "Bearer synthetic-switch-credential"
            assert body["room_id"] == settings.room_id
            sent.append(body)
            event_id = "sw_" + "e" * 32
            events.append({"id": event_id, "kind": "message", "sender": CORE_SENDER, "sender_name": "buddy",
                           "body": body["content"], "timestamp": 1_700_000_000_001})
            self.respond({"ok": True, "event_id": event_id})

        def respond(self, data):
            body = json.dumps(data).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    upstream = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=upstream.serve_forever, daemon=True)
    thread.start()
    url = "http://127.0.0.1:" + str(upstream.server_port)
    for kind in ("mm", "switch"):
        path = tmp_path / (kind + ".token")
        path.write_text("synthetic-" + kind + "-credential")
        path.chmod(0o600)
    env = dict(COUNCIL_MM_URL=url, COUNCIL_SWITCH_URL=url, COUNCIL_ALLOW_LOOPBACK_HTTP="true",
               COUNCIL_CHANNEL_ID=CHANNEL, COUNCIL_ROOM_ID=settings.room_id, COUNCIL_AGENT_ID=settings.agent_id,
               COUNCIL_READER_USER_ID=READER, COUNCIL_SENDER_USER_ID=SENDER,
               COUNCIL_HUMAN_USER_IDS=json.dumps([HUMAN]), COUNCIL_MM_TOKEN_FILE=str(tmp_path / "mm.token"),
               COUNCIL_SWITCH_TOKEN_FILE=str(tmp_path / "switch.token"),
               COUNCIL_STATE_FILE=str(tmp_path / "stdio.sqlite"), COUNCIL_ENABLE_WRITES="true",
               COUNCIL_SEAT="buddy", COUNCIL_CORE_SENDER_ID=CORE_SENDER)

    async def scenario():
        params = StdioServerParameters(command=sys.executable,
                                       args=[str(ROOT / "integrations/council-mcp/server.py")], env=env)
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                tools = await session.list_tools()
                assert {t.name for t in tools.tools} == TOOLS
                result = await session.call_tool("read_history", {"limit": 1})
                assert not result.isError and "synthetic-123" in str(result)
                assert "sw_" + "d" * 32 in str(result) and CORE_SENDER in str(result)
                args = dict(source_post_id=SOURCE, message="stdio reply", request_id="stdio-request1")
                first = await session.call_tool("post_message", args)
                second = await session.call_tool("post_message", args)
                assert not first.isError and not second.isError
                assert "sw_" + "e" * 32 in str(first) and "duplicate" in str(second)
    try:
        asyncio.run(scenario())
        assert len(sent) == 1
    finally:
        upstream.shutdown()
        upstream.server_close()
        thread.join(timeout=2)
