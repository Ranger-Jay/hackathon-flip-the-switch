# D1 — Track 01 Demo: Pitch, Script, Storyboard, Shot Inventory

> Public-safe copy. Private event IDs, room identifiers, and host details live
> in the private ledger; this document contains no private identifiers.

**Mission:** Flip the Switch — Council Room, Track 01 Best Business Workflow
**Owner:** Boons. **Reviewer:** Buddy Main. **UI:** Gem (Council Chamber UI track).
**Deadline:** Sat Nov 7, 2026, 1:29 PM ET.
**Status:** DRAFT — no official video max exists (verified in D0); Jay's cap is
~5:00 total — main story ~3:00 + technical cut ~2:00 in one video.
**Honesty rule:** every claim in the script maps to a PASS in the D0 truth matrix
or is labeled PARTIAL / DEMO FIXTURE on screen. No invented footage, no fake
console output, no simulated human approval.

## 1. Creative brief / value proposition

- **Audience:** a hackathon judge who has never seen Switch; a founder who makes
  consequential decisions in scattered chats.
- **Before:** decisions happen across DMs, docs, and memory. Nobody — including the
  decision-maker, a week later — can reconstruct *how* a decision was reached, who
  said what, or what evidence it rested on.
- **After:** one Council Room. A human brings one real proposal. Distinct agents,
  each on their own runtime, assess it from their own expertise, in the open.
  An orchestrator reconciles disagreements. The human decides. The decision is
  recorded with links back to the discussion, and can be reopened later.
- **Why Switch is essential:** Switch is the coordination layer — it puts
  different original runtimes (ChatGPT, Codex, Antigravity, GrokBot, Muse) in one
  room with identity, addressing, and a durable event record. Without it, this is
  five disconnected chatbots. With it, it is one workflow.
- **Call to action:** run your own council — one room, one proposal, one
  verifiable decision.

## 2. Full narration script (main story, ~3:00, ~450 words)

Labels in [brackets] are on-screen, not spoken.

**[0:00–0:20 — OPENING: the problem]**
> "Every important decision you make leaves a trail — or it should. In practice,
> it lives in five different chats, a doc nobody updated, and your memory.
> A week later, nobody can say how the decision was reached — not even you.
> [ON SCREEN: scattered chat windows dissolving into one room]
> What if the whole decision — the proposal, the debate, the evidence, and the
> call itself — lived in one place, with a record anyone could reopen?"

**[0:20–0:45 — THE PRODUCT]**
> "This is the Council Room, built on Switch. One human, Jay — a founder — brings
> one real proposal into one real room. Around him sit specialized AI agents,
> each running on its own system, each with its own seat and identity.
> [ON SCREEN: Council Room, seats labeled Boons / Buddy / Finch / Gem / Cora]
> They don't share a brain. They share a room — and a record."

**[0:45–1:30 — THE WORKFLOW: proposal and assessment]**
> "Jay posts a real Funding Intelligence proposal: should a Council decision be
> marked ready for human approval only when it carries source-linked evidence,
> unresolved risks, a named follow-up owner, and a concrete next action?
> [ON SCREEN: LIVE — Jay's proposal message, timestamped]
> Boons reads it as the testing lead — what could break, what evidence would
> prove it. Gem reads it as source verification — which claims trace back to
> something real. Finch checks it from the code side.
> [ON SCREEN: LIVE — two or more genuine agent replies, distinct angles]
> These aren't auto-replies. Each agent answered from its own runtime — and the
> room shows you exactly when, and as whom."

**[1:30–2:05 — RECONCILIATION]**
> "Buddy, the orchestrator, reads the whole thread and reconciles it — where the
> agents agree, where they conflict, and what's still uncertain.
> [ON SCREEN: LIVE — Buddy's synthesis message]
> Nothing is smoothed over. The disagreement stays visible, because the
> disagreement is part of the decision."

**[2:05–2:35 — THE HUMAN DECISION]**
> "And then the only part that matters most: a human decides. Jay approves,
> declines, or defers — in his own words, in the room.
> [ON SCREEN: LIVE — Jay's decision message]
> No agent approves on his behalf. The system is built so it can't."

**[2:35–3:00 — THE RECORD + CLOSE]**
> "The decision is written down as a durable record, linked back to every message
> that shaped it — and it can be reopened from a fresh start, with the links
> still working.
> [ON SCREEN: decision document reopened, source links]
> One human. Many minds. One coordinated decision — and a verifiable record of
> how it was reached. That's the Council Room. That's Flip the Switch."

**Alternate narration for PARTIAL evidence (use if a step is unavailable):**
> "This step is still being proven live, so what you're seeing is a labeled
> demonstration of the interface — the live room behind it is real, and the
> honest status is on screen."

## 3. Deeper technical cut (final ~2:00 of the same video, 3:00–5:00)

1. Direct-seat proof: Buddy and Finch each post from their own original
   conversations and read their own events back; coexistence acceptance.
   (Events in private ledger only; public cut shows the room, not the IDs.)
2. Near-instant layer: Boons' auto-receipt (~1s) vs brain reply (~2.5–4 min) —
   receipts are fast, thinking takes time, and the video says so.
3. What is NOT claimed: cold wake, token renewal, unattended wake, full
   deliberation at scale — named on screen as open work.
4. Reproducibility: public repo, branch, docs (ROOM-TIMING, SHIM-STATUS,
   ARCHITECTURE, REPRODUCE), exact SHAs in the appendix.

## 4. Storyboard / shot list

| # | Time | Shot (16:9 HD) | Source / capture | Evidence | Label |
|---|---|---|---|---|---|
| 1 | 0:00 | Scattered chats → one room (motion graphic, original) | Editor | — | DEMO FIXTURE (graphic) |
| 2 | 0:20 | Council Room wide, seats + avatars | Mattermost council channel / Gem chamber when ready | Room `council` | LIVE (room) / DEMO FIXTURE (chamber until live-mapped) |
| 3 | 0:45 | Jay's proposal message, full text, timestamp | Mattermost capture | event ID TBD at D2 | LIVE |
| 4 | 1:00 | Agent reply 1 (testing lens) | Mattermost capture | event ID TBD at D2 | LIVE |
| 5 | 1:15 | Agent reply 2 (verification lens, different angle) | Mattermost capture | event ID TBD at D2 | LIVE |
| 6 | 1:30 | Buddy reconciliation message | Mattermost capture | event ID TBD at D2 | LIVE |
| 7 | 2:05 | Jay's decision message | Mattermost capture | event ID TBD at D2 | LIVE |
| 8 | 2:35 | Decision record doc, reopened fresh, links clicked | Screen capture | Doc link TBD at D2 | LIVE |
| 9 | 2:50 | Evidence panel / direct-seat proof montage | Mattermost + ledger (sanitized) | verified in private ledger (switch-private Issue #16) | LIVE (sanitized) |
| 10 | — | Title card + thumbnail still | Editor | — | — |

Transitions: restrained cuts and short cross-dissolves; zoom only to legible
message text. Captions: burned-in speaker labels + full subtitles file.
Music: original or properly licensed, low under narration, silent under decision
messages. No sound effects on receipts.

## 5. Shot inventory — proof events already banked (private ledger)

- Buddy write/read + reconnect — verified in private ledger (switch-private Issue #2 / #16), Nov 5–6.
- Finch write/read + "hello world" smoke test — verified in private ledger (switch-private Issue #2 / #16), Nov 6.
- Boons seat-steer prove, history HIT — verified in private ledger (switch-private Issue #2), Nov 5.
- Boons receipt/wake: human 5-sample, agent 5-sample (Nov 5) — verified in private ledger (switch-private Issue #2).
- **Still to capture at D2:** proposal event, ≥2 agent analyses, Buddy
  synthesis, Jay decision, decision record — all event IDs TBD, none invented.

## 6. Open D1 questions (need Jay / Buddy)

1. The real proposal for the Council to deliberate: Jay to pick. FI was the
   vehicle because it is a real decision on his plate — but any genuine decision
   works; the workflow is the entry, not FI. Fallback is the draft topic from
   public #10 (decision-readiness policy question). **This is the D2 critical path.**
2. Which two agents give the on-camera analyses (Boons + Gem proposed)?
3. Video length — no official max; Jay's cap ~5:00 total (main story ~3:00 +
   technical cut ~2:00 in one video).
4. Gem chamber: capture from her working preview at exact SHA when available;
   until then Mattermost is the canonical visual.
