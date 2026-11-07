# November 7 submission-candidate reproduction supplement

**Current release line:** v005.00. See [the root README](../README.md) for the public live demo and authoritative judge-facing release status. The older guidance retained below describes the staged foundation; its historical UNKNOWN statuses must not be read as the latest full UI status.

To run the actual static Council Chamber from a fresh clone, use Python 3.12, Node.js and Chrome/Chromium for the full browser matrix, then execute `python3 scripts/verify_repo.py`, `python3 scripts/run_all_ui_checks.py`, and `python3 mattermost-plugin-council/build_plugin.py`. For a local page, run `python3 -m http.server 8001` and visit `http://127.0.0.1:8001/ui/`. To reproduce agent/MCP contracts, consult `agents/README.md` and `integrations/council-mcp/README.md` and use sandbox-only credentials.

The static Vercel page is not a live authenticated Mattermost host. Private service access or deployment requires a separate authorized operator, with rollback and secrets kept outside the repository.

---

# Reproduce the Council Room

**Current status:** Foundation-only; complete application reproduction is **NOT YET VERIFIED**. This is a deliberately honest runbook that will be completed from actual testing evidence before submission.

## Currently reproducible: public repository checks

```bash
git clone https://github.com/Ranger-Jay/hackathon-flip-the-switch.git
cd hackathon-flip-the-switch
python3 scripts/verify_repo.py
```

The checker validates version references, expected documentation links, and a narrow set of public secret/prefix hazards. It does not run Switch.

While the foundation remains on a review branch rather than `main`, check out `orocue/public-foundation` to use its files. Do not present this branch as an approved release.

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

| Gate | State |
| :-- | :-- |
| Pin correct upstream version and compatible agent controller | UNKNOWN |
| Host/port health evidence | UNKNOWN |
| Native sessions and custom shim | UNKNOWN |
| Fresh-clone user journey | UNKNOWN |
| Actual video matching the steps in this file | UNKNOWN |

Do not replace this list with optimistic claims. Update from real tests with a date, command and exact artifact link.
