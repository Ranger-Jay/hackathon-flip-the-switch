# Nexus host operations

Sanitized runbook for the Switch stack on the nexus operator host. Recorded 2026-11-03. It is the public procedure for bring-up, health checks, and recovery. It has no secrets, no routable addresses, and no private credential paths.

The matching ledgers are [nexus-switch-bring-up.md](nexus-switch-bring-up.md) and [mattermost-council-channel.md](mattermost-council-channel.md).

## What this operates

- Postgres and Mattermost from the upstream local compose project.
- switch-core as a process on the host.
- The public Mattermost team `switch` and the public channel `council`.

The gateway UI on port 3000 is optional. The room path is Mattermost plus switch-core. Binding `council` to a Switch Core room, and registering agents, are separate procedures and are outside this runbook.

## Stack path

Clone upstream Switch into the operator home and work only from that directory:

```bash
git clone https://github.com/sandbox-quantum/switch.git "$HOME/switch"
cd "$HOME/switch"
```

Pin a reviewed upstream revision before a demo. This hackathon repository does not contain the stack. The clone's `.env` stays on the host.

`just up` is:

```bash
docker compose -f deploy/local/docker-compose.yml --project-directory . up -d --build
```

Use that same compose file and project directory for `ps` and `exec`. A bare `docker compose ps` at the clone root has no compose file to read.

## Environment

```bash
just init-env
```

`just init-env` copies `.env.example` and fills blank secrets on the host. It refuses to overwrite an existing `.env`, so it does not rotate live secrets. Run it only when `.env` is absent, and run it before `just up` on a fresh clone.

Upstream may print a gateway admin login to the operator terminal. Leave that output on the host. Do not paste it into chat, issues, or git.

`just up` requires `DB_OWNER_USER` and `DB_OWNER_PASSWORD` in `.env`. Those values come from `just init-env`. A hand-copied example file leaves them blank and the stack will not start.

## Start, stop, and the host process

```bash
just down    # compose down; volumes stay
just up      # postgres, init-db, mattermost, setup
just run     # switch-core on the host, API port 8000
```

Recovery that keeps data:

1. `just down`
2. `just up`
3. `just run` when the host process also needs to come back
4. `just init-env` first only when `.env` is missing

The `setup` container waits until switch-core answers `/health`, then retries on failure. A restarting `setup` container before `just run` is expected. It is a reason to start switch-core, and it is a reason to leave the volumes in place.

## Reset stays gated

```bash
just reset   # compose down -v
```

`just reset` deletes the Postgres and Mattermost volumes. Rooms, messages, and the data those volumes hold are gone. Run it only after an explicit human GO. `just down` / `just up` / `just init-env` are the recovery path, and a restart request leaves `just reset` unrun.

## Health checks

Loopback only.

```bash
docker compose -f deploy/local/docker-compose.yml --project-directory . ps
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8000/health/ready
curl -fsS http://127.0.0.1:8065/api/v4/system/ping
```

| Check | Healthy result |
| --- | --- |
| `docker compose ps` | Postgres healthy. `init-db` completed. Mattermost up. |
| `GET /health` | `{"status":"ok"}`. Liveness only. |
| `GET /health/ready` | `"status":"ready"`. On one replica the database check gates this. |
| Mattermost ping | HTTP 200 from port 8065. |

`/health` can be ok while readiness is still failing. When a readiness check was requested, require `/health/ready`. Connection refused on port 8000 means `just run` is not up; `just up` does not start switch-core.

The bring-up ledger records Postgres healthy, Mattermost healthy, and `/health` ok.

## Gateway UI

Port 3000 is the published gateway UI port (`GATEWAY_HOST_PORT`). Start it only when someone wants the browser UI (`just gateway-dev`, or the standalone gateway profile). The council room path does not use it.

## Council channel

Team name `switch`. Public channel name `council`. Create with local `mmctl` inside the Mattermost container, and only after a list shows the name is absent:

```bash
docker compose -f deploy/local/docker-compose.yml --project-directory . exec mattermost \
  mmctl channel list switch --local

docker compose -f deploy/local/docker-compose.yml --project-directory . exec mattermost \
  mmctl channel create --team switch --name council --display-name Council --public --local
```

Smoke as the seeded non-admin role `user` against `http://127.0.0.1:8065`:

1. Log in with `POST /api/v4/users/login`. The password is the host value from `just init-env`.
2. Resolve team `switch` and channel `council` by name.
3. `POST /api/v4/posts` with a non-sensitive body.
4. Read the channel posts and confirm that body came back.

Discard the login response, the token, and every returned identifier when the check is done. The smoke that already passed is recorded in [mattermost-council-channel.md](mattermost-council-channel.md).

## Keep out of git

- `.env` and anything `just init-env` printed
- Passwords, tokens, signing keys, and registration tokens
- Hostnames, LAN addresses, and tailnet addresses
- Channel, team, post, and user identifiers from the live server
- Paths of private ops checkouts and any file that holds credentials

## Human gates

| Action | Rule |
| --- | --- |
| `just down`, `just up`, `just run` | Ordinary recovery. Volumes stay. |
| `just init-env` | Only when `.env` is absent. |
| `just reset` | Explicit human GO. Destructive. |
| Copying identifiers or secrets into git or chat | Never. |
