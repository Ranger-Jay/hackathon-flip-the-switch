# Room Timing

How fast Boons answers in the council room, and why. Status as of
November 5, 2026, ~09:45 AM ET. This file complements
`docs/SHIM-STATUS.md` (the November 3 status snapshot); it does not
replace it, and it implies no merge to the default branch — it lives on
the integration branch only.

## The setup

There are two separate pieces, and they do different jobs:

1. **Auto-receipt (nexus, seconds).** A small script on the host
   (`~/switch-shim/boons_auto_receipt.py`) polls the room event log
   (`room_events.log`) every **1 second** (`POLL_SECONDS = 1`). A
   1-minute watchdog cron restarts it if it stops. On a new message
   it posts one canned receipt, in the same thread, with this exact
   wording:

   > Boons: ACK. Read — received, full reply to follow.

2. **Room wake (cloud brain, minutes).** A hook named
   `switch-room-addressed` polls every **5 seconds** (the minimum
   allowed). It wakes the cloud brain only when a new addressed
   message arrives; otherwise it stays silent. The brain then verifies
   the message and posts a real, in-role reply.

## Measured evidence

Jay's ping test on November 5, 2026, all times Eastern:

- **09:41:39** — Jay posts `@boons short ping test. respond with
  "received".` (message `sw_0a212e17150b95976677a24fd02c7cde`)
- **09:41:41** — Auto-receipt lands in-thread, **1.3 seconds**
  later (event `sw_835e769362dc4349a716e73c82dcda83`)
- **~09:41:56** — Room-wake hook fires
- **09:44:07** — Real brain reply lands: "received" (event
  `sw_faabff5c7a2c4ab4b4174d6f3498820d`, about 2.5 minutes after the
  ping)

## Targets

- **Receipt:** about 1 second on average, worst about 2 seconds.
  That meets the bar set for this work — 3 seconds target, 5 seconds
  worst — with margin.
- **Real brain reply:** **1–2 minutes is expected.** That delay is
  not a failure. The real agent is thinking: the hook wake, a live
  verification of the message, and a full reply take that long. The
  receipt is what makes the room feel near-instant while the real
  reply is being written.

## Why this was built

Before these two pieces, the room daemon only held presence and wrote
the log. Nothing woke the cloud brain, so a message sat until someone
chased it in another channel. The 08:38 ET addressed test on November 5
sat for about 23 minutes for exactly that reason. The auto-receipt and
the room wake close that gap: the receipt is immediate, and the brain
is woken within seconds.

## Bounds — what the receipt is and is not

- The auto-receipt is a receipt, **not a brain**. It cannot answer
  questions. It only says a human-addressed message was received and
  a full reply will follow.
- It replies only to messages from the human `user` seat that are
  addressed to Boons (`addressed: true`), once per message ID, in
  the same thread.
- It never replies to other agents, never replies to its own messages,
  and never replies to messages that are not addressed to Boons.
- It only acts on messages that arrive after it starts. The 53
  messages already in the log when it first started were seeded as
  seen, so nothing old gets a receipt.
- The 08:16 WORKFLOW-001 message predates these fixes and stays
  unreplied by design; a fresh addressed post is what proves the
  fixes live.
- Hook reachability over SSH was proven by a dry run before the hook
  was enabled, and the wake path was traced by hand.

## Replica notes

For anyone replicating this setup (Allen is doing so):

- Auto-receipt script: `~/switch-shim/boons_auto_receipt.py`,
  `POLL_SECONDS = 1`, 1-minute watchdog cron, decisions logged to
  `auto_receipt.log`, seen message IDs tracked durably so each
  message gets at most one receipt.
- Room-wake hook: id `switch-room-addressed`, 5-second poll,
  wakes only on a new addressed message, silent otherwise.
- Receipt wording (exact): "Boons: ACK. Read — received, full reply
  to follow."
- Filters to copy exactly: human sender only, addressed only,
  dedupe by message ID, in-thread reply.
- Allen was asked in the room to acknowledge this timing and to
  document the same setup carefully on the private repo, so the two
  records match.

## What is not claimed

- No merge to the default branch is implied by this file.
- The receipt is not proof that the brain has answered — only that
  the message was received and a real reply is coming.
- Timings above are measured from one live test plus the poll
  intervals; they are not a guarantee for every message.
