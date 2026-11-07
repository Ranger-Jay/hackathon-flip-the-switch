# Verification and acceptance ledger

Every result must distinguish **theoretical support**, **mock test**, **local test**, **live Switch room proof**, and **independent reproduction**. No unexecuted checklist item is PASS.

| ID | Acceptance criterion | Required artifact | State |
| :-- | :-- | :-- | :-- |
| U1 | Human can enter the only Council Room | Verified setup path and room ID | LIVE ROOM PROOF (public summary; private event IDs) |
| U2 | Human can post one real proposal | Message ID and screenshot | LIVE ROOM PROOF (Jay-authored event) |
| U3 | Roles and participant identity are distinct | Actual member list/UI | LIVE ROOM PROOF (multiple verified senders) |
| U4 | Agents receive addressed work and respond in-role | Provider session/response IDs | PARTIAL LIVE PROOF (participating agents only) |
| U5 | Orchestrator reconciles with evidence | Linked summary message | LIVE ROOM PROOF (bounded synthesized tally) |
| U6 | Human makes the final call | Human-authored decision message | UNKNOWN |
| U7 | Durable decision record can be reopened | Document link and cited messages | UNKNOWN |
| U8 | Switch is essential to the workflow | Controlled outage and recovery transcript | UNKNOWN |
| U9 | Same room survives reconnect | Restart/rejoin log and history proof | UNKNOWN |
| U10 | Third party reproduces it from a fresh clone | Host details, commands and outputs | UNKNOWN |
| UX1 | Primary journey works on keyboard and touch | Browser test evidence | CI BROWSER PASS (9/9 UI suites) |
| UX2 | 3D enhancement has accessible 2D fallback | Reduced motion and no-WebGL tests | CI BROWSER PASS (9/9 UI suites) |
| UX3 | Performance remains acceptable | Device/browser results and defined budget | CI BROWSER PASS (5-viewport matrix) |

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

## November 7 release-candidate evidence (v005.00)

The original acceptance matrix above remains conservative for deployment-wide claims.
The actual November 7 human-led Switch Council session included multiple verified participants, authentic event IDs, real room post/readback and a discussion leading to a later human priority selection. Public non-secret evidence is documented at [hackathon issue #10](https://github.com/Ranger-Jay/hackathon-flip-the-switch/issues/10); private operational logs remain private. The exact in-room final human decision/decision-document correlation is **not** established by a client-side UI display, so U6–U7 remain UNKNOWN.

**Independent UI verification:** [9/9 complete UI suites and 11/11 bridge tests](https://github.com/Ranger-Jay/hackathon-flip-the-switch/actions/runs/42393874555) passed on the UI line, including Chrome five-viewport matrix and offline Mattermost harness. [MM Host navigation hotfix](https://github.com/Ranger-Jay/hackathon-flip-the-switch/actions/runs/42394069389) passed with an actual click regression and subsequent independent public browser check. The unified v005.00 release line must independently pass its own CI before a final GO.

**Explicitly NOT proven by these tests:** live Mattermost production installation, viewer-scoped browser-to-Core API, autonomous original ChatGPT mention wake, complete host-level cold reboot recovery, automatic model-use cost caps, or public-access availability of a protected Vercel review build. UI historical receipts and specimen simulations are always labeled separately from genuine live room events.
