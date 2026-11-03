# Reproduce the Council Room

**Current status:** Complete application reproduction is **NOT YET VERIFIED**. Host-observed notes are in [PROGRESS.md](PROGRESS.md): the general snapshot is 2026-11-03, about 1:12 PM America/New_York, and the Switch Console install note is about 1:20 PM ET. This runbook lists commands a fresh reproducer would run. It does not invent output that was not captured.

## Currently reproducible: public repository checks

```bash
git clone https://github.com/Ranger-Jay/hackathon-flip-the-switch.git
cd hackathon-flip-the-switch
python3 scripts/verify_repo.py
```

The checker validates version references, expected documentation links, and a narrow set of public secret/prefix hazards. It does not run Switch.

The progress notes in this revision are on `work/cora-reproducibility`. They are not on `main` until a reviewed merge. Do not present this branch as an approved release. Acceptance IDs in [TESTING.md](TESTING.md) stay **UNKNOWN** until the artifacts listed there exist. The gate table below only narrows items where a host-side report exists.

## Requirements for the eventual end-to-end reproduction

- Tested OS and resource requirements, listed exactly.
- An upstream Switch revision pinned to an immutable commit.
- Prerequisites: Docker, Python/`uv`, Node/package manager and `just` where the tested Switch setup requires them.
- A public, safe `.env.example` containing **variable names only**, with instructions to create strong local secrets.
- Clone / build / start / health-check commands with captured outputs.
- Install and authenticate the providers supported by the tested version (no credential copying).
- One non-sensitive sample proposal, actual in-room response proof and a durable decision record.
- Reconnect proof, failure handling and documented cleanup.
- A repeat attempt on a fresh machine that did not participate in development.

## Upstream reference (not yet certified here)

Start with [Switch's CONTRIBUTING.md](https://github.com/sandbox-quantum/switch/blob/main/CONTRIBUTING.md) or its standalone instructions. Its development process currently documents `just init-env`, `just up`, `just run` and `just gateway-dev`. These are **upstream instructions, not a tested guarantee for this repository**. The provider/runtime details may change; we will pin and retest them.

## Blocks to resolve before submission

States below are as of 2026-11-03 ~1:12 PM ET, except the Switch Console lines, which include a host report at about 1:20 PM ET. **PARTIAL** means a host-side report exists and is not an independent reproduction. No health-response body from the development host is stored in git. Those bodies were not re-fetched for this revision. SSH from a cloud sandbox to the development host port 22 was reported as `Operation not permitted` (outbound TCP blocked).

| Gate | State | Evidence language |
| :-- | :-- | :-- |
| Pin correct upstream version and compatible agent controller | UNKNOWN | No upstream Switch git revision is pinned here. Switch Console Windows x64 **v0.40.1** is installed and running on Old-Faithful as of about 1:20 PM ET (`C:\Program Files\Switch Console\Switch Console.exe`). That is a desktop build, not a server pin. The Core server URL in Console is **UNCONFIRMED**. |
| Host/port health evidence | PARTIAL (host-observed) | On `nexus` (Linux Mint), Switch Core/bridge port **8000** was reported healthy and Mattermost port **8065** was reported up. Gateway UI port **3000** was down at an earlier check the same day and is not re-verified. Response bodies are not in this repository. |
| Native sessions and custom shim | PARTIAL | Boons was registered out of band (no token in git). Host-local shim: **outbound post PASS; inbound stream not yet proven.** Switch Console is installed and running on Old-Faithful (~1:20 PM ET); the window is visible. Core server URL, connected/disconnected status, and Codex/council room join are **UNCONFIRMED** (not a join PASS). Antigravity and Cursor CLI join-and-reply remain UNKNOWN. |
| Fresh-clone user journey | UNKNOWN | `python3 scripts/verify_repo.py` only checks this repository. No fresh machine has reproduced the room workflow. |
| Actual video matching the steps in this file | UNKNOWN | No demo video is in this repository. |

Do not replace this list with optimistic claims. Update from real tests with a date, command and exact artifact link.

## Commands a fresh reproducer runs on the host

Run these **on the Switch host** after setting `SWITCH_BASE_URL` to that host's bridge URL (the bridge, not the Gateway UI). Do not point them at a LAN or tailnet address copied from a private note into git. The outputs are **not** recorded in this repository; write down the status and body you actually receive.

```bash
# Bridge health. A host-side report on 2026-11-03 said this was ok.
# The body was not archived here.
curl -fsS "${SWITCH_BASE_URL}/health"

# Mattermost system ping on the host. Port 8065 was reported up.
curl -fsS "http://127.0.0.1:8065/api/v4/system/ping"

# Gateway UI. It was down earlier on 2026-11-03. Record the code.
# Do not assume success.
curl -sS -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3000/"
```

Shim commands, once the client is present in the revision you checked out, are documented beside that client. Running them from a network that cannot reach the host is expected to fail and is not a health result.
