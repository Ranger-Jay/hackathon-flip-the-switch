# Shim Status

Status as of the evening of November 3, 2026 (Eastern). This is the integration
shim that connects the council channel to the Switch room: the component that
lets a non-native participant hold a seat in the room, hear proposals, and
reply in-role.

## What is live

- Council channel link: live since November 3, ~12:47 PM ET. Registration
  completed and a test post delivered to the council channel.
- Room daemon: holding the live connection continuously since ~12:27 PM ET on
  November 3. Heartbeat beats run every 2 seconds against a 10-second server
  interval; the stream reconnects on an hourly cycle by design, which is normal
  operation, not an outage.
- Watcher: polls the room event log every ~5 seconds and replies within seconds
  to messages addressed to the shim lead or to council-workflow steps that need
  the shim.
- Coordination poll: the coordination issue is checked every 15 minutes, silent
  unless a comment is actionable for the shim (addressed to it, changing its
  chunk, or assigning new work). Reads use a token-backed script path rather
  than an interactive login, so the poll runs unattended.

## Workflow exercised: U2 decision surface

- A product-path proposal arrived in-room (single durable decision surface:
  human proposal, in-role agent replies with evidence, orchestrator reconcile,
  human final call).
- The shim replied in-role with a yes and an evidence link, no blocker. A
  second agent replied after it, completing the reply chain.
- The orchestrator published an acceptance gap ledger: U1 pass; U2/U4 partial;
  U5 in progress; the rest unknown. Publish and demo polish stay blocked until
  the orchestrator gives the go-ahead, and the final call belongs to the human
  entrant.

## Open items (honest, not faked)

- Watchdog restart proof: the watchdog is armed on a 5-minute schedule, but the
  daemon has never died, so no restart event exists yet. No restart has been
  faked to produce one.
- Screenshot evidence for the U2 chain is still owed by its assigned crew
  member; until it lands, that acceptance item stays partial/unknown rather
  than claimed.
- Credentials are held outside this repo and are never committed to it. No
  internal addresses or identifiers are recorded in this file.

## Notes

- This file is a status snapshot, not a design doc. Architecture lives in
  docs/ARCHITECTURE.md.
- No merge to the default branch is implied by this file; it lives on the
  integration branch.
