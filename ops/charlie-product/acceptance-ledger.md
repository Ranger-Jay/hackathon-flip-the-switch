# Track 01 product acceptance ledger

Public product-test record for the Council Room workflow. Recorded 2026-11-03. Server identifiers, credentials, addresses, and private hostnames stay off this page.

The foundation acceptance table is [docs/TESTING.md](../../docs/TESTING.md). It arrived with the public foundation on [pull request #1](https://github.com/Ranger-Jay/hackathon-flip-the-switch/pull/1), which already carries an independent clarity review. This ledger does not revise those foundation files.

The IDs below match that table. The state column is the product-test state on this date. `docs/TESTING.md` still prints every row as UNKNOWN, because that file is unchanged and its U1 artifact includes a room ID. This page does not publish a room ID.

## Status

| ID | Acceptance criterion | State | Product-test reading |
| :-- | :-- | :-- | :-- |
| U1 | Human can enter the only Council Room | PASS | A non-admin seeded product-test user joined LAN Mattermost team `switch` and channel `council`, and a post succeeded. An independent continuity check matched the create evidence. The proof post is captured in a private coordination issue. Detail: [u1-council-entry.md](u1-council-entry.md). |
| U2 | Human can post one real proposal | UNKNOWN | No business proposal is proven in the room. |
| U3 | Roles and participant identity are distinct | UNKNOWN | Distinct participant identities are unproven. |
| U4 | Agents receive addressed work and respond in-role | UNKNOWN | No in-role agent response is proven. |
| U5 | Orchestrator reconciles with evidence | UNKNOWN | No evidence-linked reconciliation is proven. |
| U6 | Human makes the final call | UNKNOWN | No human-authored decision message is proven. |
| U7 | Durable decision record can be reopened | UNKNOWN | No durable decision record is proven. |
| U8 | Switch is essential to the workflow | UNKNOWN | No controlled outage and recovery transcript is proven. |
| U9 | Same room survives reconnect | UNKNOWN | No restart or rejoin history is proven. |
| U10 | Third party reproduces it from a fresh clone | UNKNOWN | No fresh-clone reproduction is proven. |
| UX1 | Primary journey works on keyboard and touch | UNKNOWN | No keyboard or touch browser evidence. |
| UX2 | 3D enhancement has accessible 2D fallback | UNKNOWN | No reduced-motion or no-WebGL evidence. |
| UX3 | Performance remains acceptable | UNKNOWN | No device, browser, or budget result. |

## Hold on U2 and later

U2 through U10, and UX1 through UX3, stay UNKNOWN until Switch Core room binding and Boons registration are complete. That pair is the orchestrator gate. Proposal, agent join, decision, outage, reconnect, and third-party reproduction tests wait on it.

The U1 pass is channel entry on LAN Mattermost. Core room binding remains unproven, which is why the later rows stay UNKNOWN.

## Left off this page

- Passwords, tokens, and `.env` values
- LAN addresses and private hostnames
- Mattermost user, channel, team, and post identifiers
- SSH key names
- The body of the private coordination issue
