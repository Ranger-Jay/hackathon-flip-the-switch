# Council Chamber UI/UX & Mattermost 12.0.1 Integration Handoff

## 1. Executive Summary
This document provides the complete engineering, UX, verification, and operator handoff for the **Switch Council Chamber (`work/gem-council-chamber` / `agents/gem-council-chamber`)** delivered across the 6 original feature slices (`bd1a9b94` / `3528aaff`), the initial P0 hardening slice (`slice-7-p0-truth-hardening`), and the four focused final acceptance slices (`C1`–`C4`):

| Slice Tag | Scope | Key Artifacts | Verification Suite |
| :--- | :--- | :--- | :--- |
| `gem/council-ui/slice-1-manifest` | Baseline inventory, Mattermost 12.0.1 surface verification, 9 local PNG portraits + SVG fallbacks, canonical JSON Schema | `ui/avatars/*.png`, `ui/contracts/council-event-schema.json`, `docs/COUNCIL_UI_INTEGRATION_MANIFEST.md` | `python scripts/test_ui_assets.py` |
| `gem/council-ui/slice-2-plugin-shell` | Mattermost 12.0.1 WebApp plugin (`com.switch.council-chamber`), `.tar.gz` generator, host harness | `mattermost-plugin-council/`, `ui/plugin-bundle.js`, `ui/mm-harness.html` | `python scripts/test_mm_plugin.py` |
| `gem/council-ui/slice-3-event-chamber` | Event adapter, 3 operating modes, honest 7-state seat model, XSS-safe markdown/DOM renderer | `ui/event-adapter.js` | `python scripts/test_event_adapter.py` |
| `gem/council-ui/slice-4-evidence-panel` | Source-linked Evidence & Decision Panel, role assessments, reconciliation matrix, truthful human gate | `ui/evidence-panel.js` | `python scripts/test_evidence_panel.py` |
| `gem/council-ui/slice-5-cinematic-polish` | Full UI integration, Boons Operator Presentation Mode, active speaker beam, 5-viewport Chrome verification | `ui/index.html`, `ui/app.js`, `ui/style.css`, `ui/captures/*.png` | `node scripts/test_browser_matrix.js` |
| `gem/council-ui/slice-6-handoff` | Unified verification runner, operator & plugin runbooks, rollback procedures | `docs/COUNCIL_UI_HANDOFF.md`, `scripts/run_all_ui_checks.py` | `python scripts/run_all_ui_checks.py` |
| `gem/council-ui/slice-7-p0-truth-hardening` | Initial P0/P1/P2 Truthfulness & Provenance Hardening | `ui/event-adapter.js`, `ui/evidence-panel.js`, `ui/app.js`, `scripts/serve_council_live.py` | `python scripts/run_all_ui_checks.py` |
| `gem/council-ui/c1-evidence-status-truth` | **Corrective Slice C1:** Reject placeholder IDs (`sw_receipt_*`, `mm_post_*`, `hist_summary_*`) from `LIVE_EVENT` even with `hostAuthProof`; enforce `CURATED_HISTORICAL_SUMMARY` & `Current Online: UNKNOWN` | `ui/event-adapter.js`, `scripts/test_event_adapter.py` | `python scripts/test_event_adapter.py` |
| `gem/council-ui/c2-live-transport-human-gate` | **Corrective Slice C2:** Bind `SwitchCoreBridge` strictly to `/api/council/live-history` proxy (no `/rooms/{id}/events` assumption); enforce 6-category separation (`WORKFLOW_COMPLETENESS_STATUS`) & fail-closed human verdict gate | `ui/app.js`, `ui/evidence-panel.js`, `scripts/test_evidence_panel.py` | `python scripts/test_evidence_panel.py` |
| `gem/council-ui/c3-mattermost-functional-integration` | **Corrective Slice C3:** Mount functional 9-seat React Council Ring + Redux channel stream inside `#mmPluginChamberRootMount` and wire `navigateToChannelPostDom(postId)` source highlighting | `mattermost-plugin-council/webapp/src/index.js`, `ui/plugin-bundle.js`, `ui/mm-harness.html`, `scripts/test_mm_plugin.py` | `python scripts/test_mm_plugin.py` |
| `gem/council-ui/c4-verification-handoff` | **Corrective Slice C4:** Behavioral negative tests, refreshed multi-viewport & harness screenshots, and reconciled documentation handoff | `scripts/test_browser_matrix.js`, `ui/captures/*.png`, `docs/COUNCIL_CHAMBER_WALKTHROUGH.md`, `docs/COUNCIL_UI_INTEGRATION_MANIFEST.md`, `docs/COUNCIL_UI_HANDOFF.md` | `python scripts/run_all_ui_checks.py` |

---

## 2. Truthfulness, Security & Boundary Guarantees (`C1` – `C4`)
1. **Curated Historical Proof Summaries vs. Live Receipts (`C1` / `P0.1`):**
   - Historical Nov 5–6 seat-steer records in `VERIFIED_RECEIPT_EVENTS` and `VERIFIED_ROLE_ASSESSMENTS` carry `provenance: "CURATED_HISTORICAL_SUMMARY"`, `evidence_category: "HISTORICAL_READINESS_SUMMARY"`, and `source_verified_link: false`, retaining real recorded Switch event IDs (`sw_e3abd2912ee949338cfd0ce4a4a6a00f`, `sw_9f3f6de5d9774c43914093ae1be5187e`) where applicable and `hist_summary_*` elsewhere.
   - Placeholder IDs (`sw_receipt_*`, `mm_post_*`, `hist_summary_*`, `demo_*`) are programmatically rejected from ever being accepted as `LIVE_EVENT` receipts even if passed with a `hostAuthProof`.
   - Historical summary badges are rendered **disabled/non-clickable** (`disabled`, `aria-disabled="true"`).
2. **Honest 7-State Participant Status Model (`C1` / `P0.2`):**
   - In `VERIFIED_RECEIPTS` (Historical Proofs) and idle `DEMO_SPECIMEN` modes, all 9 seats default to **`unknown`** (`9 Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`).
   - Diagnostics footer accurately reports the 8-seat runtime breakdown: `4 Mode-A · 2 Pattern-B · 2 Direct-MCP`.
3. **Fail-Closed `LIVE_READONLY` Default & `SwitchCoreBridge` Proxy Boundary (`C2` / `P0.3`):**
   - `SwitchCoreBridge` binds strictly to `/api/council/live-history` (`scripts/serve_council_live.py` -> Switch Core `GET /agents/{id}/rooms/{room}/history` server-side) and never assumes a direct browser `/rooms/{id}/events` route.
   - Selecting `LIVE_READONLY` defaults immediately to **`[LIVE NOT CONNECTED]` / `LIVE PREVIEW UNAVAILABLE`** (`nexusStatus = "NOT CONNECTED"`, `transportState = "disconnected"`) and withholds historical fixtures.
   - Fault-injection buttons are explicitly prefixed with **`SIMULATE:`**.
4. **Six-Category Evidence Separation & Fail-Closed Human Decision Gate (`C2` / `P0.4` & `P1.6`):**
   - `buildEvidenceModel` explicitly separates `HISTORICAL_READINESS_SUMMARY`, `LIVE_COUNCIL_ASSESSMENT`, `DEMO_SPECIMEN_ASSESSMENT`, `ORCHESTRATOR_RECONCILIATION`, `HUMAN_DECISION_RECORD`, and `WORKFLOW_COMPLETENESS_STATUS` (`INCOMPLETE_WORKFLOW_AWAITING_LIVE_DELIBERATION_AND_DECISION`).
   - Only a `hostAuthProof`-verified live decision event with `authenticated_principal === "jay"`, non-placeholder `source_msg_id`, matching `proposal_correlation_id`, and an explicit uppercase verdict in `{"APPROVED", "DECLINED", "DEFERRED"}` unlocks the human decision gate.
5. **Functional Mattermost Plugin Mount & Local-Harness Distinction (`C3` / `P1.5`):**
   - Both the RHS component (`createRHSComponent`) and the Root Chamber Overlay (`createRootOverlayComponent` inside `#mmPluginChamberRootMount`) mount real interactive React components (9-seat circular ring, Redux channel post stream, fail-closed decision gate, and `navigateToChannelPostDom` post-to-source highlighting).
   - `ui/mm-harness.html` is explicitly labeled `⚠️ LOCAL MATTERMOST v12.0.1 PLUGIN HOST HARNESS (OFFLINE SIMULATION — PRODUCTION SERVER INSTALL UNVERIFIED)`. Production Mattermost installation remains gated on explicit human sysadmin approval.

---

## 3. End-to-End Verification Command
Run the complete 7-suite verification gate:
```bash
python scripts/run_all_ui_checks.py
```
