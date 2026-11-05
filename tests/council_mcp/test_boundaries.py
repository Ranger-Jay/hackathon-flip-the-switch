import asyncio
from dataclasses import replace
import json
import os
from pathlib import Path
import httpx
import pytest

from conftest import CHANNEL, HUMAN, READER, SENDER, SOURCE, FOREIGN, CORE_SENDER, FORGED_EVENT_ID, Upstream
from config import BUDDY_CLIENT, BUDDY_RESOURCE, CouncilError, FINCH_CLIENT, SHARED_CLIENT, private_file, secret
from core import Council, MAX_RESPONSE


def run(coro):
    return asyncio.run(coro)


def test_read_history_returns_core_sender_for_fixed_room(rig):
    council, backend = rig
    backend.core_events.append({
        "id": "sw_" + "c" * 32, "kind": "message", "sender": CORE_SENDER, "sender_name": "buddy",
        "body": "nonce synthetic-123", "timestamp": 1_700_000_000_000,
    })
    result = run(council.read_history())
    assert result["room_id"] == council.s.room_id
    assert result["events"][0]["event_id"] == "sw_" + "c" * 32
    assert result["events"][0]["sender"] == CORE_SENDER
    assert result["events"][0]["own_seat"] is True and result["seat"] == "buddy"
    assert result["events"][0]["content_is_untrusted"]
    assert "synthetic-123" in result["events"][0]["message"]
    assert not backend.sent
    assert backend.requests[-1].url.path.endswith("/ops/read_context")
    assert json.loads(backend.requests[-1].content)["room_id"] == council.s.room_id
    assert all(r.url.host == "switch.example" for r in backend.requests)


@pytest.mark.parametrize("channel_type", ["D", "G", "unknown"])
def test_dms_and_group_dms_rejected(rig, channel_type):
    council, backend = rig
    backend.channel_type = channel_type
    with pytest.raises(CouncilError, match="prohibited"):
        run(council.identity())


def test_wrong_reader_and_foreign_cursor_rejected(rig):
    council, backend = rig
    backend.reader = HUMAN
    with pytest.raises(CouncilError, match="identity"):
        run(council.identity())
    backend.reader = READER
    with pytest.raises(CouncilError, match="cursor"):
        run(council.read_history(before="yesterday"))
    backend.core_events.append({
        "id": "post_" + "z" * 22, "kind": "message", "sender": CORE_SENDER,
        "body": "not a core event", "timestamp": 1,
    })
    with pytest.raises(CouncilError, match="sw_"):
        run(council.read_history())


@pytest.mark.parametrize("mutation", [dict(user_id=SENDER), dict(user_id=READER),
                                       dict(delete_at=1), dict(type="system_join"),
                                       dict(channel_id="z" * 26)])
def test_only_active_approved_human_source_authorizes_send(rig, mutation):
    council, backend = rig
    backend.posts[SOURCE].update(mutation)
    with pytest.raises(CouncilError):
        run(council.post_message("Test response", "request1", "jay", SOURCE))
    assert backend.sent == []


@pytest.mark.parametrize("message", ["", "a" * 3001, "@Buddy wake", "hello @channel", "bad\x00text"])
def test_mentions_and_invalid_messages_rejected(rig, message):
    council, backend = rig
    with pytest.raises(CouncilError):
        run(council.post_message(message, "request1", "jay", SOURCE))
    assert not backend.sent


def test_non_sw_submission_is_unknown_and_not_resent(rig):
    council, backend = rig
    backend.bad_event_id = True
    with pytest.raises(CouncilError, match="unknown"):
        run(council.post_message("test", "request1", "jay"))
    assert len(backend.sent) == 1
    again = run(council.post_message("test", "request1", "jay"))
    assert again["duplicate"] and again["status"] == "unknown" and again["event_id"] is None
    assert len(backend.sent) == 1


def test_empty_core_history_is_success_without_invented_events(rig):
    council, _backend = rig
    result = run(council.read_history())
    assert result["events"] == [] and result["room_id"] == council.s.room_id
    assert result["truncated"] is False


def test_writes_default_off(settings):
    disabled = replace(settings, writes_enabled=False)
    backend = Upstream(disabled)
    council = Council(disabled, httpx.AsyncClient(transport=httpx.MockTransport(backend)))
    with pytest.raises(CouncilError, match="disabled"):
        run(council.post_message("test", "request1", "jay"))
    assert not backend.requests


def test_durable_duplicate_and_conflict_are_not_resent(rig):
    council, backend = rig
    first = run(council.post_message("test", "request1", "jay", SOURCE))
    assert first["status"] == "confirmed" and first["event_id"].startswith("sw_")
    assert first["sender"] == CORE_SENDER
    restarted = Council(council.s, council.client)
    assert run(restarted.post_message("test", "request1", "jay", SOURCE))["duplicate"]
    for content, principal in [("changed", "jay"), ("test", "another")]:
        with pytest.raises(CouncilError, match="conflict"):
            run(restarted.post_message(content, "request1", principal, SOURCE))
    assert len(backend.sent) == 1
    assert backend.sent[0]["room_id"] == council.s.room_id


def test_concurrent_duplicates_submit_once(rig):
    council, backend = rig
    async def concurrent():
        return await asyncio.gather(*(council.post_message("same", "request1", "jay", SOURCE) for _ in range(8)))
    result = run(concurrent())
    assert len(result) == 8 and len(backend.sent) == 1


def test_ambiguous_timeout_never_resends_and_markers_are_not_proof(rig):
    council, backend = rig
    backend.fail_send = True
    with pytest.raises(CouncilError, match="unknown") as error:
        run(council.post_message("test", "request1", "jay", SOURCE))
    assert "secret" not in str(error.value)
    assert run(council.post_message("test", "request1", "jay", SOURCE))["status"] == "unknown"
    assert len(backend.sent) == 1
    marker = backend.sent[0]["content"]
    backend.posts["v" * 26] = dict(id="v" * 26, channel_id=CHANNEL, user_id=SENDER,
                                  message=marker, delete_at=0)
    backend.core_events.append({
        "id": FORGED_EVENT_ID, "kind": "message", "sender": "someone-else", "sender_name": "other",
        "body": marker, "timestamp": 1_700_000_000_500,
    })
    receipt = run(council.get_receipt("request1", "jay"))
    assert receipt["status"] == "unknown" and receipt["event_id"] is None
    assert len(backend.sent) == 1
    with pytest.raises(CouncilError, match="No receipt"):
        run(council.get_receipt("request1", "other"))


def test_cancellation_leaves_durable_no_resend_barrier(rig):
    council, backend = rig
    async def cancelled(service, method, path, body=None, params=None):
        if service == "switch":
            raise asyncio.CancelledError()
        return await original(service, method, path, body, params)
    original = council.request
    council.request = cancelled
    with pytest.raises(asyncio.CancelledError):
        run(council.post_message("test", "request1", "jay", SOURCE))
    assert council.state.get("request1", "jay")["status"] == "unknown"
    assert run(council.post_message("test", "request1", "jay", SOURCE))["duplicate"]


def test_per_source_and_hourly_limits(rig):
    council, backend = rig
    run(council.post_message("first", "request1", "jay", SOURCE))
    with pytest.raises(CouncilError, match="source"):
        run(council.post_message("second", "request2", "jay", SOURCE))
    council.s = replace(council.s, max_writes_hour=1)
    backend.posts[FOREIGN] = dict(backend.posts[SOURCE], id=FOREIGN)
    with pytest.raises(CouncilError, match="Hourly"):
        run(council.post_message("second", "request2", "jay", FOREIGN))
    # A direct seat post is not charged against the human-source ceiling.
    # The hourly ceiling still bounds it.
    council.s = replace(council.s, max_writes_hour=6)
    posted = run(council.post_message("direct", "request-direct", "jay"))
    assert posted["source_id"] is None and posted["event_id"].startswith("sw_")
    assert posted["sender"] == CORE_SENDER
    council.s = replace(council.s, max_writes_hour=2)
    with pytest.raises(CouncilError, match="Hourly"):
        run(council.post_message("another direct", "request-direct-2", "jay"))


@pytest.mark.parametrize("status", [302, 401, 503])
def test_upstream_errors_redacted_no_redirect(rig, status):
    council, backend = rig
    backend.override = lambda r: httpx.Response(status, text="sensitive upstream data",
                                               headers={"Location": "https://foreign.example"})
    with pytest.raises(CouncilError) as error:
        run(council.identity())
    assert "sensitive" not in str(error.value)
    assert len(backend.requests) == 1


def test_response_size_bound(rig):
    council, backend = rig
    backend.override = lambda r: httpx.Response(200, content=b" " * (MAX_RESPONSE + 1))
    with pytest.raises(CouncilError, match="size"):
        run(council.identity())


def test_credentials_file_permissions_symlink_and_state_binding(settings, tmp_path):
    token = tmp_path / "credential"
    token.write_text("synthetic-secret-value")
    token.chmod(0o644)
    with pytest.raises(CouncilError, match="0600"):
        secret(token)
    token.chmod(0o600)
    assert secret(token) == "synthetic-secret-value"
    link = tmp_path / "link"
    link.symlink_to(token)
    with pytest.raises(CouncilError, match="regular"):
        private_file(link)
    first = Council(settings)
    assert os.stat(settings.state_file).st_mode & 0o777 == 0o600
    with pytest.raises(CouncilError, match="another seat"):
        Council(replace(settings, agent_id="00000000-0000-4000-8000-000000000003"))
    run(first.client.aclose())


def test_private_parent_and_redacted_configuration(settings, tmp_path):
    assert settings.mm_token not in repr(settings) and settings.switch_token not in repr(settings)
    directory = tmp_path / "shared"
    directory.mkdir(mode=0o755)
    with pytest.raises(CouncilError, match="0700"):
        private_file(directory / "state", create=True)


def test_one_state_file_cannot_change_seat(settings):
    first = Council(settings)
    try:
        with pytest.raises(CouncilError, match="another seat"):
            Council(replace(settings, seat="finch", core_sender_id="seat:finch"))
    finally:
        run(first.client.aclose())


def test_finch_rejects_buddy_resource_and_shared_client(settings):
    http = dict(transport="streamable-http", issuer_url="https://auth.example/realms/council/",
                jwks_url="https://auth.example/jwks", subjects=("finch-subject",),
                seat="finch", core_sender_id="seat:finch", runtime_label="Finch",
                oauth_client_id=FINCH_CLIENT,
                public_url="https://nexus.tail3b496f.ts.net:8444")
    assert replace(settings, **http).validate().resource == "https://nexus.tail3b496f.ts.net:8444/mcp"
    with pytest.raises(CouncilError, match="Buddy resource"):
        replace(settings, **dict(http, public_url="https://nexus.tail3b496f.ts.net")).validate()
    with pytest.raises(CouncilError, match="Buddy client"):
        replace(settings, **dict(http, oauth_client_id=BUDDY_CLIENT)).validate()
    with pytest.raises(CouncilError, match="not a principal"):
        replace(settings, **dict(http, oauth_client_id=SHARED_CLIENT)).validate()
    assert BUDDY_RESOURCE == "https://nexus.tail3b496f.ts.net/mcp"


def test_audit_names_seat_and_omits_message_text(rig):
    council, _backend = rig
    run(council.read_history(principal="jay"))
    run(council.post_message("secret-body-text", "request1", "jay"))
    raw = Path(council.s.state_file).read_bytes()
    assert b"secret-body-text" not in raw and b"synthetic-seat-credential" not in raw
    import sqlite3
    rows = sqlite3.connect(council.s.state_file).execute(
        "SELECT principal, seat, tool, outcome FROM audit ORDER BY id").fetchall()
    assert ("jay", "buddy", "read_history", "ok") in rows
    assert ("jay", "buddy", "post_message", "confirmed") in rows


@pytest.mark.parametrize("url", ["http://mm.example", "https://user:pass@mm.example", "https://mm.example/path"])
def test_origins_cannot_be_credentialed_or_arbitrary_paths(settings, url):
    with pytest.raises(CouncilError):
        replace(settings, mm_url=url).validate()
