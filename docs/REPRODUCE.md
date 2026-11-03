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
