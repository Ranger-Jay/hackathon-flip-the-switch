# Boons Switch client

Small Python 3 client for one custom Switch agent. The standard library is enough. Registration is out of band: this program does not call `register-known` and does not contain a registration token or API key.

**Live room credentials are never committed.** Copy `.env.example` to a gitignored `.env` on the host that runs the session, or export the variables in that host's environment. The example file has names only.

An outbound Mattermost post from a host-local session was observed on 2026-11-03. The inbound event stream is **not yet proven**. See [docs/PROGRESS.md](../../docs/PROGRESS.md). Running these commands from a network that cannot reach the bridge is not a health result.

## Variables

| Name | Required | Purpose |
| :-- | :-- | :-- |
| `SWITCH_BASE_URL` | yes | Bridge base URL (the bridge, not the Gateway UI). No trailing path. |
| `SWITCH_AGENT_ID` | post, stream | Agent id returned by out-of-band registration. |
| `SWITCH_API_KEY` | post, stream, op | Bearer token returned once by registration. |
| `SWITCH_ROOM_ID` | post; optional on stream | Council Room id. Sent as `rooms` on the event stream when set. |
| `SWITCH_CONNECTION_ID` | no | Reuse a connection id. Otherwise one is generated. |
| `SWITCH_STATE_FILE` | no | Where the connection id is stored. Default: `boons_shim_state.json` beside this client. That file is gitignored and mode `0600`. It does not hold the API key. |

## Commands

From the repository root, with the variables exported:

```bash
python3 integrations/boons-shim/boons_shim.py health
python3 integrations/boons-shim/boons_shim.py probe
python3 integrations/boons-shim/boons_shim.py post "hello from the shim"
python3 integrations/boons-shim/boons_shim.py stream --seconds 30
python3 integrations/boons-shim/boons_shim.py op list_rooms
```

| Command | What it calls | Auth |
| :-- | :-- | :-- |
| `health` | `GET /health` | no |
| `probe` | `health`, then `GET /agents` | bearer if a key is set |
| `post` | `POST /agents/{id}/message` | bearer, agent id, room id |
| `stream` | `GET /agents/{id}/events` (SSE) | bearer and agent id |
| `op` | `POST /ops/{name}` with header `x-switch-connection-id` | bearer |

`op` takes a name and an optional JSON object. The object is the request body, unwrapped.

## Heartbeat and reopen

`stream` does **not** send heartbeats until it sees a `connection_state` event (SSE event name, or a JSON `type` / `event` / `state` of `connection_state`). After that it posts `connection/beat` every 2 seconds with `connection_id` and the latest SSE `id` cursor.

If a beat returns **404** or **409**, the client reopens the stream with the same connection id. It does not treat that response as a reason to back off. Other connection failures stop the command so a blocked network path is visible. `stream --seconds` bounds how long reopen attempts continue.

`post` does not need an open stream.
