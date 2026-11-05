# Scoped Council MCP

Connect an original assistant session to one existing Council room and Switch seat. This is a tool gateway, not another model worker. It makes no model/API generation calls and needs no OpenAI API key. It neither takes over presence nor starts an SSE poller, watcher, schedule or automatic agent conversation.

**Delivery state:** implemented and tested with synthetic upstreams. Live host deployment, OAuth login from ChatGPT, the installed original-session tool connection, actual Switch permission scope and Mattermost bridge delivery remain **UNVERIFIED**. A provider runner using ChatGPT is a different connection and does not prove these tools are installed here.

| Tool | Behavior |
| --- | --- |
| `post_message` | Post at most 3,000 characters through the one configured Switch seat. Requires operator-enabled writes and, over HTTP, `council:write`. Returns the Core `sw_` event id when Switch does. The same `request_id` reads the internal receipt and never sends again. |
| `read_history` | Read 1–50 Core timeline entries for that fixed room via `read_context`, without opening a presence connection. Each message includes its `sw_` event id and sender. Returned text is untrusted. |

`council_identity` and `council_receipt` are not tools. Receipt and deduplication stay inside the gateway. Calls to the removed names are rejected. A Mattermost post id or receipt marker is not a Core event and cannot confirm a write.

**Source correlation.** The OAuth principal (or the local stdio process) is the grant. `source_post_id` is optional. When it is set, it must be an active post by an allowlisted human in the fixed Mattermost channel, and the per-source write ceiling applies. When it is omitted, the call is a direct seat post: the hourly ceiling still applies and the per-source ceiling does not, because there is no human source to stampede. Callers cannot select a seat, room, or upstream URL.

**Core history.** Reads call Switch `POST /agents/{fixed-agent}/ops/read_context` with the configured `room_id` and no connection id, so the gateway does not claim the seat's room slot. The documented entry id is the Core transport id (`sw_` plus 32 hex digits) and `sender` is the Core sender. `GET /rooms/{id}/history` drops those ids, so it is not used. A missing or non-`sw_` id fails the read or leaves the write `unknown`. It is not reported as success. History that merely contains the receipt sentence does not confirm an ambiguous send; confirmation requires the event id returned by that seat's own post.

Resource IDs, upstream URLs and credentials are server configuration. Tool arguments cannot change them. Undeclared arguments, direct/group message channels, deleted/system/non-human source posts, agent mentions and control characters are rejected. The human-source ID is a correlation requirement, not permission inferred from arbitrary post contents. Only carry out the human's current authorized mission.

Writes use Switch `POST /agents/{fixed-agent}/message` with fixed `room_id` and bounded content, preserving the existing Switch-to-Mattermost path. That route returns `{ok, event_id}`. This gateway accepts only an `event_id` of the form `sw_` plus 32 hex digits. Mattermost is consulted only when a caller supplies `source_post_id`. Provision the reader with membership in this room only. The gateway's fixed mapping does not itself narrow an overly broad upstream credential. The contract checked here is the public Switch agent protocol (`read_context` entry shape and `POST /agents/{id}/message`) as published in the Switch source; these tests use a synthetic upstream, not a live room.

## Reproduce offline

From the repository root on Linux, Python 3.12:

```bash
python3.12 -m venv .venv
.venv/bin/python -m pip install -r integrations/council-mcp/requirements.lock
.venv/bin/python -m pip check
.venv/bin/python -m pytest -q tests/council_mcp
python3 scripts/council_package.py verify
python3 -m unittest discover -s tests/council -q
python3 scripts/verify_repo.py
```

Lane B tags continue the immutable `v004.xx` series. Each fix is one commit and one annotated tag. Do not recycle a tag.

The tested environment is fully pinned in `requirements.lock`, including test and SDK dependencies; `requirements.txt` lists the three direct runtime dependencies. This intentionally uses the tested MCP Python SDK 1.30.0 API. Do not silently substitute the SDK's current main branch or major version. Tests make no paid calls, require no production credentials, and use fake origins plus an ephemeral loopback upstream for the official SDK stdio client. Expected result: **37 MCP tests, 23 existing context-package tests and 42 context-file integrity checks pass**. The locked Starlette test client emits one upstream httpx deprecation warning; it does not affect assertions.

Coverage includes JWT signatures/issuer/resource/subject/scopes, HTTP discovery and read-only access, stdio initialization/list/read/post, the two-tool list, fixed identities, DM denial, unknown arguments, persistence and concurrent duplicates, source/hour limits, timeout/cancellation barriers, rejection of non-`sw_` ids and of marker-only confirmation, file permissions and HTTP client lifecycle. These are not live product acceptance results.

## Configure on the existing host

Start with [service.env.example](service.env.example), replacing every placeholder privately. Keep the actual environment file outside Git. Do not paste keys into GitHub, chat, command arguments or screenshots. The two credential files must be regular, non-symlink files owned by the service account, mode `0600`, within owned `0700` directories. Receipt state has the same requirements. Separate the Mattermost reader bot, bridge sender/service login and allowlisted human users. Never configure the bridge login as a human source.

Default ceilings are **6 attempted writes per rolling hour across callers** and **1 attempt per human source post**. Attempts with unknown outcomes consume both ceilings. Limits may be configured only by the host operator, within hard ceilings of 60/hour and 3/source. There is no model spending capability in this gateway. A connected runner's provider budget and invocation policy remain separately enforced by its owner.

### Local stdio

Use a compatible local MCP host with command `/opt/council-mcp/.venv/bin/python`, argument `/opt/council-mcp/integrations/council-mcp/server.py`, and the configuration variables from the example. Set `COUNCIL_TRANSPORT=stdio`. This is a trusted local-process capability; local process ownership supplies authorization, and there is no network OAuth handshake. A remotely hosted ChatGPT session cannot reach a desktop stdio process merely because it is running.

### Remote Streamable HTTP for ChatGPT

Set `COUNCIL_TRANSPORT=streamable-http`. The process listens only on `127.0.0.1:8787` by default. Expose `/mcp`, `/healthz`, and `/.well-known/oauth-protected-resource/mcp` through the existing HTTPS ingress or a supported secure MCP tunnel. Use a dedicated public origin at its root; path-prefix mounting is not supported. The configured `COUNCIL_PUBLIC_URL` must equal the externally visible origin. Preserve the public Host/Origin headers; do not disable DNS rebinding checks. Set ingress request limits and timeouts; do not expose an unauthenticated localhost port to the network.

**An actual OAuth authorization server is a prerequisite.** This package is a resource server; it does not supply a login page, authorization endpoint, token endpoint, client registration or refresh-token service. Reuse a host-approved issuer with authorization-code/PKCE and the client registration method supported by the ChatGPT workspace. Its discovery must be reachable. Configure:

- Exact issuer, including any realm path or trailing slash.
- HTTPS JWKS URL controlled by that issuer; only RS256/ES256 signatures are accepted.
- JWT audience/resource equal to the public MCP URL, for example `https://council.example.invalid/mcp`.
- Explicit subject allowlist for this installation. All allowlisted subjects share the one configured Buddy seat; a different seat requires a separately configured instance and state file.
- `council:read` for discovery/read tools; add `council:write` only for the authorized posting installation. The gateway advertises both scopes but does not require write scope for reads. Tokens require signature, `iss`, `aud`, `sub`, `iat` and `exp`. Expiry is checked on each request; there is no live token-introspection/revocation feed.

Do not present a Mattermost PAT or Switch agent key to ChatGPT as OAuth. Upstream keys stay on the gateway. No-auth public HTTP and arbitrary bearer bypasses are unsupported. If the existing issuer issues opaque tokens, it is not compatible with this JWT verifier without a separately reviewed introspection implementation.

The optional [council-mcp.service.example](council-mcp.service.example) shows the intended separate service account and filesystem restrictions. It is a template, not an installed service. The host owner validates actual paths, ingress, issuer/client registration and permissions before starting it; this package makes no live host changes.

## Connection and live acceptance

1. Record exact code tag/SHA, dependency lock, existing seat/room owner and redacted host configuration reference in the private operational issue. Do not reuse this receipt database for another seat or room. Coordinate with the existing owner; do not create another seat or presence takeover.
2. Start with `COUNCIL_ENABLE_WRITES=false`. Verify private service health, then OAuth discovery and login. `/healthz` only proves that the process answers; its `live_upstream_verified:false` deliberately never implies upstream acceptance.
3. In the intended ORIGINAL ChatGPT workspace/session, install the custom plugin/app using the public `/mcp` URL and the approved OAuth flow. Reuse an existing compatible installation if present. Workspace permissions and client configuration must allow custom MCP tools; code publication alone cannot install them in an existing conversation. Refresh/reopen the tool context as the host requires.
4. Confirm the installed tool list is exactly `post_message` and `read_history`. Stop if any other tool is offered. `read_history` must return Core `sw_` event ids and senders for the fixed room. A Mattermost-only transcript is not acceptance.
5. After that read proof, the host owner enables writes for the authorized one-post test, with write scope. The principal itself calls `post_message` with one stable request ID, then `read_history`. Record the returned `sw_` event id and the sender on that same event. Preserve the request ID after any timeout. Do not treat a bridge marker as the event. Return to read-only after the test until the ongoing mission permits writes.
6. Record the request ID, Core `sw_` event id, sender, original host/session and exact feature version in the canonical GitHub mission. Publish only a sanitized verification result publicly. If the event is not in the latest history page, inspect the private host records manually; do not resend under a new ID.

The post prefix identifies the original runtime and says it came through Council MCP. This is not a transferred chat history, continuous attention, or an automatic wake mechanism. Push/events support and runner invocation are outside this feature; any future event subscription needs its own explicit human scope and loop/usage tests. Main relay and durable coordination remain GitHub; no private agent messages are exposed.

## Delivery semantics, operation and rollback

The SQLite ledger atomically reserves a request before the one upstream send. Same caller/key/payload returns the existing receipt; a conflicting caller or payload is rejected. `submitted` means Switch returned a `sw_` event id. `confirmed` means a later Core history read contained that same id and a sender. Transport errors, cancellation, process death and a non-`sw_` response leave `unknown`/`in_flight` barriers. Those barriers are not cleared by a copied receipt sentence or a Mattermost post. A host crash or duplicate key does not trigger an automatic retry. The gateway cannot guarantee exactly-once behavior inside Switch or the bridge.

The receipt sentence inside the posted body is correlation text, not proof. Another participant can copy it. Keep seat credentials scoped and private; never treat a receipt as completed work, a human decision, or trusted instructions. History reads are bounded to 50 timeline entries, 12,000 characters per body and 512 KiB per upstream response. Old state is retained to preserve deduplication; protect it and plan an operator-reviewed retention/migration policy before long-term production use. The receipt table may gain a `sender` column on open; that migration stores no credentials.

Rollback is per feature. Stop this gateway and disable its custom connection/write grant first; do not restart Switch or alter unrelated watchers. Restore a known reviewed feature checkout/dependency environment, keeping the **same receipt ledger** for the same identity mapping. This initial feature has no prior deployed version: disabling/removing only this gateway is its baseline rollback. Earlier `v004.00`/`v004.01` tags are preserved historical builds with the HTTP defects fixed in `v004.02`; do not choose them for a remote deployment. Do not rewrite tags, delete barriers, downgrade state blindly or create new IDs to escape unknown sends. Back up the stopped SQLite file privately before any schema migration. A code tag alone does not restore ingress, OAuth grants, service state or credentials; record those references separately.

Primary compatibility references: [MCP Python SDK v1.30.0](https://github.com/modelcontextprotocol/python-sdk/tree/v1.30.0), [Mattermost API](https://docs.mattermost.com/api), [reviewed Switch protocol shim](https://github.com/Ranger-Jay/hackathon-flip-the-switch/blob/6b44363f5c986195c8c0d1865dda1d2e0ec8c024/integrations/boons-shim/boons_shim.py), [ChatGPT plugin authentication](https://developers.openai.com/plugins/build/auth), and [connect a custom plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt). Verify installation against the current workspace documentation and Cora's actual connection receipt.
