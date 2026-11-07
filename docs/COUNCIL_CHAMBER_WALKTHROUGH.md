# Switch Council Chamber UI/UX — Architecture & Verification Walkthrough

**Branch (Public):** `work/gem-council-chamber`  
**Branch (Private):** `agents/gem-council-chamber`  
**Original 6-Slice Reference:** `bd1a9b94ca041e22d3224c68ca297cbe573bcfe5` (public) / `3528aaff66af6d227327870f8906c5eacc5ce317` (private)  
**Corrective Acceptance Slices:** `C1` (`gem/council-ui/c1-evidence-status-truth`), `C2` (`gem/council-ui/c2-live-transport-human-gate`), `C3` (`gem/council-ui/c3-mattermost-functional-integration`), `C4` (`gem/council-ui/c4-verification-handoff`)

---

## 1. Corrective Slice C1 — Evidence Provenance & Honest Seat Status (`P0.1` & `P0.2`)

1. **Curated Historical Proof Summaries vs. Live Receipts:**
   - Historical Nov 5–6 seat-steer records in `ui/event-adapter.js` (`VERIFIED_RECEIPT_EVENTS`) and `ui/evidence-panel.js` (`VERIFIED_ROLE_ASSESSMENTS`) carry `provenance: "CURATED_HISTORICAL_SUMMARY"`, `evidence_category: "HISTORICAL_READINESS_SUMMARY"`, and `source_verified_link: false`.
   - Real recorded Switch event IDs (`sw_e3abd2912ee949338cfd0ce4a4a6a00f` for Gem Pattern-B and `sw_9f3f6de5d9774c43914093ae1be5187e` for Finch Direct-MCP) are preserved alongside `hist_summary_*` identifiers for the remaining seats.
   - Placeholder identifiers (`sw_receipt_*`, `mm_post_*`, `hist_summary_*`, `demo_*`) are programmatically rejected from ever being ingested or validated as `LIVE_EVENT` receipts even if passed with a `hostAuthProof`.
   - Historical summary pills render as **disabled/non-clickable** (`disabled === true`, `aria-disabled="true"`).
2. **Honest Seat Status & Runtime Breakdown:**
   - In `VERIFIED_RECEIPTS` (Historical Proofs) and idle `DEMO_SPECIMEN` modes, all 9 seats default to **`unknown`** (`Current Online: UNKNOWN`).
   - Header seat counter displays: `9 Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`.
   - Diagnostics footer displays: `4 Mode-A · 2 Pattern-B · 2 Direct-MCP`.

---

## 2. Corrective Slice C2 — Honest Live Transport, 6-Category Separation & Fail-Closed Human Gate (`P0.3`, `P0.4`, `P1.6`)

1. **Fail-Closed `LIVE_READONLY` & `SwitchCoreBridge` Route Alignment:**
   - Verified against deployed Switch Core (`:8000`): direct browser `EventSource('/rooms/{id}/events')` is invalid (`404 Not Found`), and Core `GET /agents/{id}/rooms/{room}/history` requires a server-side Bearer header.
   - `SwitchCoreBridge` in `ui/app.js` binds strictly to the read-only host proxy endpoint (`/api/council/live-history` served by `scripts/serve_council_live.py`) and defaults fail-closed to **`[LIVE NOT CONNECTED]` / `LIVE PREVIEW UNAVAILABLE`**, withholding offline historical fixtures when disconnected.
   - Fault-injection buttons are explicitly prefixed with **`SIMULATE:`**.
2. **Six-Category Evidence Separation (`ui/evidence-panel.js`):**
   - Explicitly separates `HISTORICAL_READINESS_SUMMARY`, `LIVE_COUNCIL_ASSESSMENT`, `DEMO_SPECIMEN_ASSESSMENT`, `ORCHESTRATOR_RECONCILIATION`, `HUMAN_DECISION_RECORD`, and `WORKFLOW_COMPLETENESS_STATUS`.
   - Renders a prominent `📊 WORKFLOW STATUS [INCOMPLETE_WORKFLOW_AWAITING_LIVE_DELIBERATION_AND_DECISION]` banner whenever live proposal assessments, live reconciliation, or Jay's live decision are not yet present.
3. **Fail-Closed Human Decision Gate:**
   - `CouncilEventAdapter.prototype.ingestEvent(rawEvent, hostAuthProof)` strips client-supplied `provenance: "LIVE_EVENT"` unless `hostAuthProof.verified_by_host_proxy === true` and `source_msg_id` is a non-placeholder ID matching `/^([a-z0-9]{26}|sw_[0-9a-fA-F]{16,64})$/`.
   - `buildEvidenceModel` requires `trusted_host_verified === true`, `authenticated_principal === "jay"`, valid `source_msg_id`, matching `proposal_correlation_id`, and an explicit uppercase verdict in `{"APPROVED", "DECLINED", "DEFERRED"}`. Missing, empty, or invalid verdicts (`null`, `""`, `"YES"`) remain locked at **`AWAITING_HUMAN_DECISION`**.

---

## 3. Corrective Slice C3 — Mattermost v12.0.1 Functional Plugin Mount & Source Navigation (`P1.5`)

- **Native React RHS & 9-Seat Root Chamber Overlay (`mattermost-plugin-council/webapp/src/index.js`):**
  - `createRHSComponent` renders the fail-closed Human Decision Gate card, active Cited Post detail, clickable Redux channel post provenance list, and the 7-role Curated Engineering Readiness Summaries.
  - `createRootOverlayComponent` natively renders the 9-seat circular Council Ring (`.mm-overlay-seat-node` × 9) and live Redux channel stream (`.mm-overlay-post-card`) inside `#mmPluginChamberRootMount` via `React.createElement` (no static placeholder text or external iframe injection).
  - Clicking any post citation in the RHS, Root Overlay, or channel post action triggers `navigateToChannelPostDom(postId)`, scrolling to and highlighting `#mm-post-row-<id>` in the `#council` channel DOM.
- **Explicit Local Harness vs. Production Server Boundary (`ui/mm-harness.html`):**
  - Top bar is prominently labeled: `⚠️ LOCAL MATTERMOST v12.0.1 PLUGIN HOST HARNESS (OFFLINE SIMULATION — PRODUCTION SERVER INSTALL UNVERIFIED)`.

---

## 4. Corrective Slice C4 — Verification Suites, Screenshots & Public Hygiene (`P2.7`–`P2.9`)

- Public files (`ui/index.html`, `ui/app.js`, and all 10 screenshots in `ui/captures/*.png`) use public-safe identifiers (`switch-council-track01 (Public Preview)` and `switch/council (Public Preview)`), with zero private room/channel UUIDs.
- All 7 automated verification suites (`python scripts/run_all_ui_checks.py`) pass with exit code `0`.
