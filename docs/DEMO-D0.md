# D0 — Track 01 Demo: Rules, Truth Matrix, Operator Checklist

> Public-safe copy. Private event IDs, room identifiers, and host details live
> in the private ledger; this document contains no private identifiers.

**Mission:** Flip the Switch — Council Room, Track 01 Best Business Workflow
**Owner:** Boons (demo direction, assembly, evidence, rehearsal, video/script)
**Reviewer:** Buddy Main. **UI/UX:** Gem (Council Chamber UI track). **Deadline:** Sat Nov 7, 2026, 1:29 PM ET
**Status:** COMPLETE — rules verified live Nov 6, 11:02 PM ET.
**Sources:** demo mission brief and Buddy/Finch direct-seat record (private repo); public workflow issue #10.

## 1. Contest rules — VERIFIED LIVE Nov 6, 11:02 PM ET

Sources: https://www.wemakedevs.org/hackathons/switch (crawled 2026-11-07 04:02 UTC),
https://www.devtoolsacademy.com/hackathons/flip-the-switch (same crawl).

- **Deadline: Sat Nov 7, 2026, 11:59 PM IST = 1:29 PM ET.** Confirmed on both pages.
  Submit only if ready; submit only on Jay's explicit GO.
- **Track 01: Best Business Workflow, $2,000 cash.** "For the most practical
  workflow where people and AI agents get work done." Open to technical and
  nontechnical participants, any combination of people, agents, rooms.
- **Entry:** solo or team up to 4. Anyone 18+, anywhere (sanctioned regions excluded).
  Multiple tracks allowed. Jay is the solo human entrant.
- **What you submit:** (1) a public project repository, (2) a **short demo video**
  of the workflow running, (3) a README explaining how Switch was used — which
  agents connected, how the channel is set up, how to run it. Optional: blog post.
- **Video length: NO maximum stated on either official page.** "Short demo video"
  only. Jay's call (Nov 6, ~11:59 PM ET): **~5 min max** — that is what other
  entrants are doing; anything less is fine. Main story ~3:00 + technical cut
  ~2:00 in one video (D1).
- **Video hosting/format: not specified on either page.** UNKNOWN — assume a
  standard public link (YouTube unlisted/public) as the submission field expects;
  confirm on the submission form before finalizing.
- **Judging (DevTools Academy mirror, weights):** Use of Switch 30% ("Is Switch
  central, and would it stop working without it?"); Technical execution 25%
  ("Does it run, and could someone clone the repo and reproduce it?"); Creativity
  and impact 25%; Presentation and documentation 20% ("Do the demo video and
  README make it clear what you built and how Switch is used?"). WeMakeDevs page
  lists the same four criteria (weights render as 0% there — use the mirror's).
  Process: every submission reviewed by WeMakeDevs, shortlist, finalists judged
  by a joint panel (Switch, DevTools Academy, WeMakeDevs).
- **Switch mandatory and central.** README must show how it was used. Existing
  agents allowed; the Switch setup and the workflow must be built during the
  hackathon (Nov 4–7).
- **AI tools:** permitted; entrant must understand and be able to explain the
  submission. Official Rules (Terms) prohibit automated/bot registration and
  submission — a human submits.
- **Submission route:** WeMakeDevs' own platform (not Devfolio/Devpost):
  https://www.wemakedevs.org/hackathons/switch/submit — form is JS-rendered
  behind a WeMakeDevs account sign-in, so exact form fields (video URL field,
  track selector, etc.) are UNKNOWN until a signed-in check. A human submits;
  bots/scripts for registration or submission are prohibited by the Official Rules.
  Jay's WeMakeDevs registration: **CONFIRMED Nov 6 (~11:59 PM ET)** — "yes, all set there."
- **Prizes:** $10,000 pool; Track 01 $2,000; Track 02 $2,000; Track 03 $100×20;
  Wispr $500; Best Blog AirPods 5; certificates for every submission.

## 2. What we're selling (one line)

One human, multiple specialized AI agents, one coordinated decision, and a
verifiable record of how that decision was reached — in one real Council room,
on Switch, with the human deciding.

## 3. Acceptance truth matrix (SHOT / SOURCE / CLAIM / PASS–UNKNOWN)

Room: council (one canonical room; its identifier lives in the private ledger).

### PASS — verified, demonstrable

| Claim | Evidence |
|---|---|
| Boons near-instant receipt + wake | Auto-receipt 1s poll, hook 5s poll. Human 5-sample: receipts ≤~1s, wakes ~0s. Agent 5-sample: receipt avg 941ms / worst 1,046ms PASS; wake avg ~1.3s / worst ~4.4s PASS (Nov 5; verified in private ledger (switch-private Issue #2)). |
| Buddy direct-seat post + read-back | Direct post + read-back from Buddy's own seat, Nov 5 (sender buddy, own-seat confirmed), plus a reconnect proof Nov 6 — verified in private ledger (switch-private Issue #2 / #16). |
| Finch direct-seat post + read-back | Direct post + read-back from Finch's own seat, Nov 6, including a "hello world" write/read smoke test — verified in private ledger (switch-private Issue #2 / #16). |
| Buddy + Finch coexistence | Sequential acceptance PASS (Nov 6): Finch login did not displace Buddy; own-seat flags correct per reader — verified in private ledger (switch-private Issue #16). |
| Boons own-runtime seat steer | One-seat helper (tag seat-steer-oneseat-v001.00); own-prove PASS, history HIT (Nov 5) — verified in private ledger (switch-private Issue #2). |
| Room live | Daemon + auto-receipt running, crons intact (verified live Nov 6 ~11 PM ET). |
| Gem UI assets exist | Baseline `work/gem-interface` @ `d237b14`; hardening branch `2ea95b2` / mirror `cc60c91` (Gem's UI track, private repo). |

### UNKNOWN — must NOT be claimed in the video

- Cold wake: ~17–21s vs ≤5s target (Nov 5). Brain replies run ~2.5–4 min. Receipts are the near-instant part, not brain replies.
- Token auto-renewal / 30-day refresh lifecycle (TTL 30d ≠ proof of auto-renewal).
- Unattended agent wake; simultaneous in-flight stress; reverse-principal rejection in this run.
- Full multi-agent deliberation on a real proposal; source-linked persisted decision; reboot persistence.
- Gem UI: no live event mapping yet; `SwitchCoreBridge` is a stub; Mattermost plugin install gate unknown; deployed-plugin compatibility unverified.
- Public #10 12-step acceptance checklist: entirely unchecked — no live proposal posted, no agent deliberation, no human decision, no durable decision record yet.

### Footage labels (use on every shot)

- **LIVE** — real room event with a Switch event ID, named runtime, timestamp.
- **MANUAL-ASSISTED** — a human or relay moved the step; say so on screen.
- **DEMO FIXTURE** — offline UI / simulated pane, clearly labeled, never mixed visually with live footage.
- **RECEIPT ONLY** — transport ACK / auto-receipt, not a model turn. Never present as reasoning.

## 4. Production approach (until Gem's UI lands)

1. Build the story around verified beats: proposal → ≥2 genuine agent analyses →
   Buddy reconciliation → Jay's real decision → durable decision record.
2. Draft proposal topic (from public issue #10, Jay may replace): "Should a Council
   decision be marked ready for human approval only when it includes source-linked
   evidence, unresolved risks, a named follow-up owner and a concrete next action?"
   Needs Jay's pick of the real proposal for the Council to deliberate — any genuine
   decision works; the workflow is the entry, not any one topic. This is the
   D2 critical path.
3. Capture what is live now (room, receipts, direct-seat proofs) while Gem builds;
   integrate her chamber when a working preview at exact SHA exists.
4. No merge / deploy / restart / credential change / paid invocation without Jay GO.
   Non-destructive local captures and production artifacts only.
5. Every public asset sanitized: no credentials, no private host details, no private
   event/endpoint IDs, no enrolled-subject UUIDs. Private ledger keeps the full IDs.

## 5. Known blockers (D0)

1. **No live workflow yet** — the video's core story (proposal → deliberation →
   decision → record) is still to be captured. Needs Jay's proposal pick + agent
   availability in the window.
2. **Video rules verified (see §1)** — Jay's cap ~5:00 total; hosting/format —
   confirm on the submission form before finalizing.
3. **Gem event-adapter contract undefined** — Boons↔Gem canonical event mapping
   (event IDs, Mattermost post IDs, actor, runtime/transport, timestamps,
   thread/correlation, loading/error/stale) still to be agreed.
4. **Cold wake + brain-reply latency** — cannot claim near-instant deliberation.
5. **Time** — ~14 hours to deadline at D0 start. D2 capture is the critical path.

## 6. Operator checklist (preflight, D2 capture)

- [ ] Confirm daemon + auto-receipt + hook + council poll all running (host SSH).
- [ ] Confirm one canonical room `council`, Jay's human account (not bridge/admin).
- [ ] Proposal text approved by Jay, non-sensitive, posted by Jay himself.
- [ ] Address agents individually (`@boons`, `@buddy`, …) — `@all` does not wake agents.
- [ ] One correlation/dedup key per real write; no duplicate posts on retry.
- [ ] Record per step: event ID, actor, runtime, timestamp, capture filename.
- [ ] Label every shot LIVE / MANUAL-ASSISTED / DEMO FIXTURE / RECEIPT ONLY.
- [ ] Screen hygiene: no credentials, hostnames, private IDs visible in any capture.
- [ ] Buddy reconciliation requested only after ≥2 genuine agent analyses exist.
- [ ] Jay's decision captured as his own real message; never simulated.
- [ ] Decision record written + reopened fresh with working source links.
- [ ] Send each substantial deliverable to Buddy Main for review before calling it done.
