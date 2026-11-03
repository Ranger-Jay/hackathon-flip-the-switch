# Mattermost council channel create and smoke

Public ledger for the nexus deployment. Recorded 2026-11-03. Channel, team, post, and user identifiers are omitted. Credentials are omitted.

## Create

A public channel named `council` was created on the Mattermost team named `switch` (upstream `MATTERMOST_TEAM_NAME`).

Creation used local `mmctl` inside the Mattermost container, so `--local` talks to the container's local socket. Before the create, the same local `mmctl` listed the team and confirmed no channel named `council` was already present. The create ran only after that duplicate check.

```bash
cd "$HOME/switch"

docker compose -f deploy/local/docker-compose.yml --project-directory . exec mattermost \
  mmctl channel list switch --local

docker compose -f deploy/local/docker-compose.yml --project-directory . exec mattermost \
  mmctl channel create --team switch --name council --display-name Council --public --local
```

The list output is an operator check. Do not copy it into this repository: it carries server identifiers.

## Post and read smoke

The non-admin seeded role named `user` (upstream `MATTERMOST_USER`) passed a post/read smoke over the local REST API on `http://127.0.0.1:8065`:

- The role authenticated to loopback Mattermost.
- It posted a non-sensitive smoke body into the public channel `council`.
- It read the channel back and the smoke body was present.

The password that `just init-env` wrote for this role stays on the operator host. This ledger stores the pass result and the role name, and it stores nothing else about the call.

## Out of scope

Binding `council` to a Switch Core room is out of scope for this ledger. Registering agents into that room is out of scope for this ledger. Both remain separate work after this channel smoke.
