import asyncio
from dataclasses import replace
import json
import os
from pathlib import Path
import httpx
import pytest

from conftest import CHANNEL, HUMAN, READER, SENDER, SOURCE, FOREIGN, Upstream
from config import CouncilError, private_file, secret
from core import Council, MAX_RESPONSE


def run(coro):
    return asyncio.run(coro)


def test_read_fixed_room_and_untrusted_content(rig):
    council, backend = rig
    result = run(council.read_recent())
    assert result["channel_id"] == CHANNEL
    assert result["posts"][0]["content_is_untrusted"]
    assert not backend.sent
    assert all(r.url.host == "mm.example" for r in backend.requests)


@pytest.mark.parametrize("channel_type", ["D", "G", "unknown"])
def test_dms_and_group_dms_rejected(rig, channel_type):
    council, backend = rig
    backend.channel_type = channel_type
    with pytest.raises(CouncilError, match="prohibited"):
        run(council.read_recent())


def test_wrong_reader_and_foreign_cursor_rejected(rig):
    council, backend = rig
    backend.reader = HUMAN
    with pytest.raises(CouncilError, match="identity"):
        run(council.identity())
    backend.reader = READER
    backend.posts[FOREIGN] = dict(id=FOREIGN, channel_id="z" * 26, user_id=HUMAN)
    with pytest.raises(CouncilError, match="outside"):
        run(council.read_recent(before_post_id=FOREIGN))


@pytest.mark.parametrize("mutation", [dict(user_id=SENDER), dict(user_id=READER),
                                       dict(delete_at=1), dict(type="system_join"),
                                       dict(channel_id="z" * 26)])
def test_only_active_approved_human_source_authorizes_send(rig, mutation):
    council, backend = rig
    backend.posts[SOURCE].update(mutation)
    with pytest.raises(CouncilError):
        run(council.post_reply(SOURCE, "Test response", "request1", "jay"))
    assert backend.sent == []


@pytest.mark.parametrize("message", ["", "a" * 3001, "@Buddy wake", "hello @channel", "bad\x00text"])
def test_mentions_and_invalid_messages_rejected(rig, message):
    council, backend = rig
    with pytest.raises(CouncilError):
        run(council.post_reply(SOURCE, message, "request1", "jay"))
    assert not backend.sent


def test_writes_default_off(settings):
    disabled = replace(settings, writes_enabled=False)
    backend = Upstream(disabled)
    council = Council(disabled, httpx.AsyncClient(transport=httpx.MockTransport(backend)))
    with pytest.raises(CouncilError, match="disabled"):
        run(council.post_reply(SOURCE, "test", "request1", "jay"))
    assert not backend.requests


def test_durable_duplicate_and_conflict_are_not_resent(rig):
    council, backend = rig
    first = run(council.post_reply(SOURCE, "test", "request1", "jay"))
    assert first["status"] == "submitted" and first["core_ref"]
    restarted = Council(council.s, council.client)
    assert run(restarted.post_reply(SOURCE, "test", "request1", "jay"))["duplicate"]
    for content, principal in [("changed", "jay"), ("test", "another")]:
        with pytest.raises(CouncilError, match="conflict"):
            run(restarted.post_reply(SOURCE, content, "request1", principal))
    assert len(backend.sent) == 1
    assert backend.sent[0]["room_id"] == council.s.room_id


def test_concurrent_duplicates_submit_once(rig):
    council, backend = rig
    async def concurrent():
        return await asyncio.gather(*(council.post_reply(SOURCE, "same", "request1", "jay") for _ in range(8)))
    result = run(concurrent())
    assert len(result) == 8 and len(backend.sent) == 1


def test_ambiguous_timeout_never_resends_and_can_reconcile(rig):
    council, backend = rig
    backend.fail_send = True
    with pytest.raises(CouncilError, match="unknown") as error:
        run(council.post_reply(SOURCE, "test", "request1", "jay"))
    assert "secret" not in str(error.value)
    assert run(council.post_reply(SOURCE, "test", "request1", "jay"))["status"] == "unknown"
    assert len(backend.sent) == 1
    backend.posts["v" * 26] = dict(id="v" * 26, channel_id=CHANNEL, user_id=HUMAN,
                                  message=backend.sent[0]["content"], delete_at=0)
    assert run(council.get_receipt("request1", "jay"))["status"] == "unknown"
    backend.posts["v" * 26]["user_id"] = SENDER
    receipt = run(council.get_receipt("request1", "jay"))
    assert receipt["status"] == "visible" and receipt["mm_ref"] == "v" * 26
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
        run(council.post_reply(SOURCE, "test", "request1", "jay"))
    assert council.state.get("request1", "jay")["status"] == "unknown"
    assert run(council.post_reply(SOURCE, "test", "request1", "jay"))["duplicate"]


def test_per_source_and_hourly_limits(rig):
    council, backend = rig
    run(council.post_reply(SOURCE, "first", "request1", "jay"))
    with pytest.raises(CouncilError, match="source"):
        run(council.post_reply(SOURCE, "second", "request2", "jay"))
    council.s = replace(council.s, max_writes_hour=1)
    backend.posts[FOREIGN] = dict(backend.posts[SOURCE], id=FOREIGN)
    with pytest.raises(CouncilError, match="Hourly"):
        run(council.post_reply(FOREIGN, "second", "request2", "jay"))
    assert len(backend.sent) == 1


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


@pytest.mark.parametrize("url", ["http://mm.example", "https://user:pass@mm.example", "https://mm.example/path"])
def test_origins_cannot_be_credentialed_or_arbitrary_paths(settings, url):
    with pytest.raises(CouncilError):
        replace(settings, mm_url=url).validate()
