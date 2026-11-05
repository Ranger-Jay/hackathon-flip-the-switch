# Home deploy for Council MCP

This is the unprivileged layout for a later HTTP process. It does not install a system unit, does not use `/opt` or `/etc`, and does not start anything.

Copy one example per seat to a private `0600` file under `$HOME/council-mcp/{buddy,finch}/`. Put seat keys and the Mattermost reader token in sibling `0700` secret directories. The receipt and audit database stays in that seat's `state/` directory. Buddy and Finch do not share those paths.

`COUNCIL_ENABLE_WRITES` is `false` in both examples. Leave it false for the first HTTP process. A write acceptance is a separate GO after discovery, a 401, and a read of `read_history`.

Check a copied file without starting the process:

```bash
sh integrations/council-mcp/home/run-gateway.sh --check integrations/council-mcp/home/buddy.env.example
```

The helper refuses root and has no start subcommand. When an operator is later told to run it, the process is still `python3 integrations/council-mcp/server.py` from a normal user account, with the private env loaded in that shell, listening on `127.0.0.1` only. Rollback is to stop that process. Do not restart Switch, Dex, Mattermost, or any other host service, and do not delete the receipt database to "undo" a send.

## Out of scope

Funnel and `tailscale serve` are out of scope. Approving Funnel is not wiring it. Do not add serve or funnel commands to this directory. Buddy's candidate origin and Finch's candidate port are written in the env examples so they are not the same URL; neither is published by this package.

## Protect list

On Nexus at 2026-11-05 5:42 PM ET these PIDs were alive and are protected: 3678388, 3680512, 1855739, 3789275, 3789085. Do not signal, renice, restart, or target them. Re-check `ps` on that host before any later operation. PIDs from another machine are not these PIDs.

The optional `council-mcp.service.example` unit still shows an `/opt` system install. That path needs a separate sudo GO and is not this home layout.
