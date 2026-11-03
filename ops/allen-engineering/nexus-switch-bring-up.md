# Nexus Switch stack bring-up

Public ledger for the nexus deployment. Recorded 2026-11-03. This file states the observed health of the local Switch stack and the recovery rules that apply to it. Machine names, addresses, accounts, and secrets stay off this page.

## Observed state

On the nexus operator host, the upstream Switch stack reached this baseline:

- The Postgres container was healthy.
- The Mattermost container was healthy.
- switch-core was running on the host, and `GET /health` returned ok (`{"status":"ok"}`).

Postgres and Mattermost come from the local compose project. switch-core is the host process (upstream API port 8000), which is why its health check is a loopback request on the host rather than a container probe.

The gateway UI publishes on port 3000 when that process is started. It is optional. The room path recorded here is Mattermost plus switch-core.

## Stack location

The process runs from the operator home clone of upstream Switch ([sandbox-quantum/switch](https://github.com/sandbox-quantum/switch)). Commands in this ledger run from that clone:

```bash
cd "$HOME/switch"
```

This hackathon repository does not vendor the stack and does not store its `.env`.

## Checks that matched the outcome

```bash
docker compose -f deploy/local/docker-compose.yml --project-directory . ps
curl -fsS http://127.0.0.1:8000/health
curl -fsS http://127.0.0.1:8065/api/v4/system/ping
```

`/health` is liveness. The body `{"status":"ok"}` is the expected reply. Postgres health is the compose `pg_isready` check, visible in `docker compose ps`. Mattermost answers its ping on loopback port 8065.

## Recovery

Non-destructive recovery uses the upstream recipes:

1. `just down` stops the compose project and keeps volumes.
2. `just up` starts Postgres, the one-shot database init, and Mattermost again.
3. `just init-env` runs only when `.env` is missing. It generates local secrets and refuses to overwrite an existing `.env`, so it does not rotate live secrets. On a fresh clone, run it before `just up`.

`just reset` is `docker compose down -v`. It deletes the local Postgres and Mattermost volumes, including rooms and messages. It needs an explicit human GO. A request to restart the stack is a `just down` / `just up` recovery, and it leaves `just reset` untouched.
