# Verification and acceptance ledger

Every result must distinguish **theoretical support**, **mock test**, **local test**, **live Switch room proof**, and **independent reproduction**. No unexecuted checklist item is PASS.

| ID | Acceptance criterion | Required artifact | State |
| :-- | :-- | :-- | :-- |
| U1 | Human can enter the only Council Room | Verified setup path and room ID | UNKNOWN |
| U2 | Human can post one real proposal | Message ID and screenshot | UNKNOWN |
| U3 | Roles and participant identity are distinct | Actual member list/UI | UNKNOWN |
| U4 | Agents receive addressed work and respond in-role | Provider session/response IDs | UNKNOWN |
| U5 | Orchestrator reconciles with evidence | Linked summary message | UNKNOWN |
| U6 | Human makes the final call | Human-authored decision message | UNKNOWN |
| U7 | Durable decision record can be reopened | Document link and cited messages | UNKNOWN |
| U8 | Switch is essential to the workflow | Controlled outage and recovery transcript | UNKNOWN |
| U9 | Same room survives reconnect | Restart/rejoin log and history proof | UNKNOWN |
| U10 | Third party reproduces it from a fresh clone | Host details, commands and outputs | UNKNOWN |
| UX1 | Primary journey works on keyboard and touch | Browser test evidence | UNKNOWN |
| UX2 | 3D enhancement has accessible 2D fallback | Reduced motion and no-WebGL tests | UNKNOWN |
| UX3 | Performance remains acceptable | Device/browser results and defined budget | UNKNOWN |

## Test layers

**A — Foundation:** `python3 scripts/verify_repo.py`; checks public docs/security hygiene only.

**B — Component:** relevant unit tests for Switch custom bridge, room renderer, identity, state and decision contract.

**C — Real integration:** authenticated Switch service plus provider hosts; capture actual room messages and outcome.

**D — Recovery:** disconnect/restart, delayed/duplicate events, unaddressed messages, invalid credentials and user-decision preservation.

**E — Independent:** second reviewer/fresh machine reproduces exact pinned revision without developer-specific files.

## Test report template

```text
Test ID:
Version + immutable commit SHA:
Environment / upstream Switch commit:
Command(s) and exact output:
Real service, mock or static inspection:
Evidence link / room message ID:
Outcome: PASS / FAIL / BLOCKED / UNKNOWN
Independent reviewer:
Date/time:
```

The builder may report its own test result but may not be the independent acceptance authority.
