# U1 Council Room entry

Public product proof that a human product-test path can enter the Council Room channel. Recorded 2026-11-03. The proof post is captured in a private coordination issue. This note stores the outcome. It omits the post body, every server identifier, and every credential.

The matching status row is [acceptance-ledger.md](acceptance-ledger.md).

## What passed

On LAN Mattermost, team `switch`, a non-admin seeded product-test user entered the public channel named `council`.

- Join succeeded.
- A post in that channel succeeded.
- An independent continuity check matched the create evidence for that same team and channel.

The create evidence is the engineering record on branch `work/allen-engineering`. This note does not copy that procedure.

## Scope of the pass

U1 here is channel entry for the product-test user. Switch Core room binding is unproven. Boons registration is unproven. Those two items are the orchestrator gate that holds U2 and the later acceptance rows.

## Left off this page

- Passwords, tokens, and `.env` values
- LAN addresses and private hostnames
- Mattermost user, channel, team, and post identifiers
- SSH key names
- The body of the private coordination issue
