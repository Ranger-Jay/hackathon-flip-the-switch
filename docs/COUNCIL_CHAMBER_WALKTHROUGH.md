# Switch Council Chamber UI/UX — Architecture & Verification Walkthrough

**Branch (Public):** `work/gem-council-chamber`  
**Branch (Private):** `agents/gem-council-chamber`  
**Latest Tag:** `gem/council-ui/slice-7-p0-truth-hardening`

---

## 1. Truthfulness & Provenance Safeguards (P0.1 – P0.4 Hardened)

1. **Curated Historical Proof Summaries vs. Live Receipts (`P0.1`):**
   - Historical Nov 5–6 seat-steer records in `ui/event-adapter.js` (`VERIFIED_RECEIPT_EVENTS`) and `ui/evidence-panel.js` (`VERIFIED_ROLE_ASSESSMENTS`) use explicit `CURATED_HISTORICAL_SUMMARY` provenance (`source_verified_link: false`, `mm_post_id: null`).
   - Real recorded Switch event IDs (`sw_e3abd2912ee949338cfd0ce4a4a6a00f` for Gem Pattern-B and `sw_9f3f6de5d9774c43914093ae1be5187e` for Finch Direct-MCP) are preserved alongside `hist_summary_*` identifiers for the remaining seats.
   - Summary badges render as **disabled/non-clickable** (`disabled`, `aria-disabled="true"`) unless backed by an authenticated live host-proxy event (`source_verified_link === true && provenance === "LIVE_EVENT"`).

2. **Honest Seat Status & Runtime Breakdown (`P0.2`):**
   - In `VERIFIED_RECEIPTS` (Historical Proofs) and idle `DEMO_SPECIMEN` modes, all 9 seats default to **`unknown`** (`Current Online: UNKNOWN`). Historical proofs from Nov 5–6 never display as current `online` or `listening` state.
   - Header seat counter displays: `9 Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`.
   - Diagnostics bar displays the exact verified seat execution breakdown: `4 Mode-A · 2 Pattern-B · 2 Direct-MCP`.

3. **Fail-Closed `LIVE_READONLY` Default (`P0.3`):**
   - Switching to `LIVE_READONLY` defaults immediately to **`[LIVE NOT CONNECTED]` / `LIVE PREVIEW UNAVAILABLE`** (`nexusStatus = "NOT CONNECTED"`, `transportState = "disconnected"`) and withholds offline historical fixtures so they are never mistaken for live traffic.
   - Fault-injection buttons are explicitly prefixed with **`SIMULATE:`** (`SIMULATE: Stale (42s)`, `SIMULATE: 401 Denied`, `SIMULATE: Connected`).
   - Only when the local read-only proxy (`python scripts/serve_council_live.py`) responds at `/api/council/live-history` with `verified_by_host_proxy: true` does the view transition to `LIVE CONNECTED`.

4. **Fail-Closed Human Decision Gate (`P0.4`):**
   - `CouncilEventAdapter.prototype.ingestEvent(rawEvent, hostAuthProof)` strips any client-supplied `provenance: "LIVE_EVENT"` unless `hostAuthProof.verified_by_host_proxy === true` and `source_msg_id` matches `/^([a-z0-9]{26}|sw_[0-9a-fA-F]{16,64})$/`.
   - `buildEvidenceModel` in `ui/evidence-panel.js` validates `trusted_host_verified === true`, `authenticated_principal === "jay"`, valid `source_msg_id`, matching `proposal_correlation_id`, and an explicit uppercase verdict in `{"APPROVED", "DECLINED", "DEFERRED"}`.
   - Missing, empty, or invalid verdicts (`null`, `""`, `"YES"`) or unauthenticated client events fail closed and remain locked at **`AWAITING_HUMAN_DECISION`**.

---

## 2. Mattermost v12.0.1 Plugin & Local Harness (`P1.5` & `P1.6`)

- **Functional RHS & Root Overlay (`mattermost-plugin-council/webapp/src/index.js`):**
  - `createRHSComponent` renders the Human Decision Gate card, active Cited Post detail, clickable Redux channel post provenance list, and the 7-role Curated Engineering Readiness Summaries.
  - `registerWebSocketEventHandler("posted", ...)` parses incoming WebSocket post events into the plugin Redux slice and updates the channel context.
- **Explicit Local Harness Labeling (`ui/mm-harness.html`):**
  - Top bar is prominently labeled: `⚠️ LOCAL MATTERMOST v12.0.1 PLUGIN HOST HARNESS (OFFLINE SIMULATION — PRODUCTION SERVER INSTALL UNVERIFIED)`.
- **Curated Engineering Readiness Labeling (`P1.6`):**
  - Step 02 of the Evidence Panel is titled `STEP 02 · CURATED ENGINEERING READINESS SUMMARIES (7 ROLES — NOT LIVE PROPOSAL DELIBERATION)` with an explicit banner explaining that these cards summarize Nov 5–6 readiness checks rather than live deliberation on the Funding Intelligence business proposal.

---

## 3. Public Hygiene & Visual Captures (`P2.8` & `P2.9`)

- Public files (`ui/index.html`, `ui/app.js`, and all screenshots in `ui/captures/*.png`) use public-safe identifiers (`switch-council-track01 (Public Preview)` and `switch/council (Public Preview)`), with zero private room/channel UUIDs.
- All 7 automated verification suites (`python scripts/run_all_ui_checks.py`), including behavioral negative tests for P0.1–P0.4 and P1.5, pass with exit code `0`.
