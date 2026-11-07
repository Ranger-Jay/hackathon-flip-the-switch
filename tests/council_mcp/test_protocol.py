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


def test_home_env_keeps_writes_off_and_refuses_to_start(tmp_path):
    import subprocess
    from home.check_env import problems
    home = ROOT / "integrations/council-mcp/home"
    assert problems(home / "buddy.env.example") == []
    assert problems(home / "finch.env.example") == []
    bad = tmp_path / "finch.env"
    text = (home / "finch.env.example").read_text().replace(
        "COUNCIL_PUBLIC_URL=https://nexus.tail3b496f.ts.net:8444",
        "COUNCIL_PUBLIC_URL=https://nexus.tail3b496f.ts.net")
    text = text.replace("COUNCIL_ENABLE_WRITES=false", "COUNCIL_ENABLE_WRITES=true")
    text = text.replace("${HOME}/council-mcp/finch/state/receipts.sqlite", "/opt/council-mcp/receipts.sqlite")
    bad.write_text(text)
    found = " ".join(problems(bad))
    assert "false" in found and "Buddy resource" in found and "/opt" in found
    script = home / "run-gateway.sh"
    checked = subprocess.run(["sh", str(script), "--check", str(home / "buddy.env.example")],
                             capture_output=True, text=True)
    assert checked.returncode == 0, checked.stderr
    assert "was not started" in checked.stdout
    started = subprocess.run(["sh", str(script), "--start", str(home / "buddy.env.example")],
                             capture_output=True, text=True)
    assert started.returncode != 0


def test_issuer_metadata_rejects_plain_pkce_and_secret_only_clients():
    import json
    from issuer.metadata import issuer_metadata_problems
    example = json.loads((ROOT / "integrations/council-mcp/issuer/discovery.example.json").read_text())
    assert issuer_metadata_problems(example) == []
    advertised = dict(example, code_challenge_methods_supported=["S256", "plain"])
    assert any("plain" in problem for problem in issuer_metadata_problems(advertised))
    secret_only = dict(example, token_endpoint_auth_methods_supported=["client_secret_basic", "client_secret_post"])
    assert any("none" in problem for problem in issuer_metadata_problems(secret_only))
    with_iss = dict(example, authorization_response_iss_parameter_supported=True)
    assert any("9207" in problem for problem in issuer_metadata_problems(with_iss))
    clients = (ROOT / "integrations/council-mcp/issuer/public_clients.example.yaml").read_text()
    assert "chatgpt-council-buddy" in clients and "council-finch" in clients
    redirects = [line.strip() for line in clients.splitlines() if line.strip().startswith("- https://chatgpt.com/connector")]
    assert redirects and all("REPLACE_WITH_" in line and "{callback_id}" not in line for line in redirects)
    assert "public: true" in clients


def test_scope_policy_does_not_invent_write_or_accept_client_audience():
    from issuer.token_requirements import council_scopes
    resource = "https://council.example/mcp"
    client = "chatgpt-council-buddy"
    assert council_scopes(
        {"aud": resource, "azp": client, "scope": "openid council:read"}, resource, client
    ) == ["openid", "council:read"]
    assert council_scopes(
        {"aud": client, "azp": client, "scope": "openid council:read council:write"}, resource, client
    ) is None
    assert council_scopes(
        {"aud": [client, resource], "azp": client, "scope": "council:read council:write"}, resource, client
    ) is None
    assert council_scopes({"aud": resource, "azp": client, "scope": "openid"}, resource, client) is None


def test_auth_diag_logs_category_without_secrets(remote, rig, caplog):
    import logging
    caplog.set_level(logging.WARNING, logger="council.auth")
    diag = replace(remote, auth_diag=True)
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    jwks = SimpleNamespace(get_signing_key_from_jwt=lambda _token: SimpleNamespace(key=key.public_key()))
    verifier = OAuthVerifier(diag, jwks)
    quiet = OAuthVerifier(remote, jwks)

    def token(**claims):
        payload = dict(iss=diag.issuer_url, aud=diag.resource, sub="jay",
                       azp=diag.oauth_client_id, iat=int(time.time()), exp=int(time.time()) + 300,
                       scope=READ + " " + WRITE)
        payload.update(claims)
        return jwt.encode(payload, key, algorithm="RS256")

    def category_for(value):
        caplog.clear()
        assert asyncio.run(verifier.verify_token(value)) is None
        lines = [r.getMessage() for r in caplog.records if r.name == "council.auth"]
        assert len(lines) == 1
        assert lines[0].startswith("council_auth_reject ts=") and "bearer_present=true" in lines[0]
        for secret in (value, "other-seat-subject", "council-finch",
                       "foreign.example", "other.example", "eyJ", "%%%"):
            assert secret not in lines[0]
        return lines[0].rsplit("category=", 1)[1]

    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    signed = token()
    caplog.clear()
    accepted = asyncio.run(verifier.verify_token(signed))
    assert accepted is not None and accepted.subject == "jay" and not [
        r for r in caplog.records if r.name == "council.auth"]
    assert category_for(jwt.encode(jwt.decode(signed, options={"verify_signature": False}), other, algorithm="RS256")) == "signature"
    assert category_for(token(exp=int(time.time()) - 10)) == "expiry"
    assert category_for(token(iss="https://other.example")) == "issuer"
    assert category_for(token(aud="https://foreign.example/mcp")) == "audience"
    assert category_for(token(azp="council-finch")) == "client"
    assert category_for(token(scope="openid")) == "scope"
    assert category_for(token(sub="other-seat-subject")) == "subject"
    assert category_for("%%%not-a-jwt%%%") == "unknown"
    leaked = jwt.PyJWKClientError("https://keys.secret.example " + signed)
    broken = SimpleNamespace(get_signing_key_from_jwt=lambda _token: (_ for _ in ()).throw(leaked))
    caplog.clear()
    assert asyncio.run(OAuthVerifier(diag, broken).verify_token(signed)) is None
    assert caplog.records[-1].getMessage().endswith("category=jwks_fetch")
    assert "keys.secret" not in caplog.text and signed not in caplog.text
    caplog.clear()
    assert asyncio.run(quiet.verify_token("%%%not-a-jwt%%%")) is None
    assert not [r for r in caplog.records if r.name == "council.auth"]
    council, _backend = rig
    server = create_server(diag, council, verifier)
    with TestClient(server.streamable_http_app(), base_url=diag.public_url) as client:
        caplog.clear()
        denied = rpc(client, "tools/list")
        assert denied.status_code == 401
        missing = [r.getMessage() for r in caplog.records if r.name == "council.auth"]
        assert len(missing) == 1 and missing[0].endswith("bearer_present=false category=missing_bearer")
        assert "authorization" not in missing[0].lower()


def test_real_jwt_signature_and_subject_resource_checks(signer):
    verifier, token = signer
    good = asyncio.run(verifier.verify_token(token()))
    assert good.subject == "jay" and WRITE in good.scopes
    assert good.client_id == "chatgpt-council-buddy"
    read_only = asyncio.run(verifier.verify_token(token(scope="openid council:read")))
    assert read_only is not None and READ in read_only.scopes and WRITE not in read_only.scopes
    cases = [token(aud="https://foreign.example/mcp"), token(aud="chatgpt-council-buddy"),
             token(aud=["chatgpt-council-buddy", "https://council.example/mcp"]),
             token(iss="https://other.example"), token(sub="other"), token(azp="council-finch"),
             token(drop=("azp",)), token(exp=int(time.time()) - 10), token(scope=WRITE),
             token(scope="openid"), token(scope="openid profile email"),
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
        paths = {getattr(route, "path", "") for route in app.routes}
        assert not any("register" in path for path in paths)
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
