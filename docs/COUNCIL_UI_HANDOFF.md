# Council Chamber UI/UX & Mattermost 12.0.1 Integration Handoff

## 1. Executive Summary
This document provides the complete engineering, UX, verification, and operator handoff for the **Switch Council Chamber (`work/gem-council-chamber` / `agents/gem-council-chamber`)** delivered across the 6 original feature slices (`bd1a9b94` / `3528aaff`), the P0 truthfulness hardening slice (`slice-7-p0-truth-hardening`), the four final acceptance slices (`C1`–`C4`), Buddy Main's live bridge safety patch (PR #15 at `0f0e25d4`), and the Vercel static deployment integration:

| Slice / Milestone | Git Tag / Head SHA | Scope | Key Artifacts | Verification Suite |
| :--- | :--- | :--- | :--- | :--- |
| Baseline | `2ea95b24` / `cc60c91c` | Hardened UI baseline (`work/gem-ui-hardening`) | `ui/app.js`, `ui/index.html` | WCAG focus & reduced-motion gates |
| Slices 1–6 | `gem/council-ui/slice-1-manifest` .. `slice-6-handoff` | Original 6-slice Council Chamber UI/UX & Mattermost plugin (`bd1a9b94` / `3528aaff`) | `ui/`, `mattermost-plugin-council/` | Multi-suite runner |
| Slice 7 | `gem/council-ui/slice-7-p0-truth-hardening` | Initial P0/P1/P2 Truthfulness & Provenance Hardening | `ui/event-adapter.js`, `ui/evidence-panel.js` | 7-suite runner |
| Corrective C1 | `gem/council-ui/c1-evidence-status-truth` | Reject placeholder IDs (`sw_receipt_*`, `mm_post_*`) from `LIVE_EVENT` even with `hostAuthProof`; `CURATED_HISTORICAL_SUMMARY` & default `UNKNOWN` seat status | `ui/event-adapter.js`, `scripts/test_event_adapter.py` | `test_event_adapter.py` |
| Corrective C2 | `gem/council-ui/c2-live-transport-human-gate` | Bind `SwitchCoreBridge` strictly to `/api/council/live-history` proxy; 6-category separation (`WORKFLOW_COMPLETENESS_STATUS`); fail-closed human verdict gate | `ui/app.js`, `ui/evidence-panel.js`, `scripts/test_evidence_panel.py` | `test_evidence_panel.py` |
| Corrective C3 | `gem/council-ui/c3-mattermost-functional-integration` | Mount functional 9-seat React Council Ring + Redux channel stream inside `#mmPluginChamberRootMount` and wire `navigateToChannelPostDom(postId)` source highlighting | `mattermost-plugin-council/webapp/src/index.js`, `ui/plugin-bundle.js`, `ui/mm-harness.html` | `test_mm_plugin.py` |
| Corrective C4 | `gem/council-ui/c4-verification-handoff` | Behavioral negative tests, refreshed multi-viewport & harness screenshots, reconciled documentation handoff | `scripts/test_browser_matrix.js`, `ui/captures/*.png`, `docs/COUNCIL_CHAMBER_WALKTHROUGH.md` | Full 7-suite runner |
| Bridge Safety (PR #15) | `0f0e25d4e144674d915bb85b9945a0b4b553d894` | Reconcile Buddy Main P0 live proxy hardening: reject fabricated/inferred event IDs; loopback-only binding; 11 offline unit tests | `scripts/serve_council_live.py`, `scripts/test_live_bridge.py`, `docs/GEM_LIVE_WIRING_ACCEPTANCE.md` | `test_live_bridge.py` |
| Vercel Deployment | Active delivery head | Static Vercel deployment configuration (`vercel.json`), security headers, path rewrites, zero CDN dependencies, static compatibility test suite | `vercel.json`, `scripts/test_vercel_static_config.py` | `test_vercel_static_config.py` |

---

## 2. Truthfulness, Security & Boundary Guarantees
1. **Curated Historical Proof Summaries vs. Live Receipts (`C1` / `P0.1`):**
   - Historical Nov 5–6 seat-steer records carry `provenance: "CURATED_HISTORICAL_SUMMARY"`, `evidence_category: "HISTORICAL_READINESS_SUMMARY"`, and `source_verified_link: false`.
   - Real recorded Switch event IDs (`sw_e3abd2912ee949338cfd0ce4a4a6a00f`, `sw_9f3f6de5d9774c43914093ae1be5187e`) are preserved alongside `hist_summary_*` identifiers.
   - Placeholder IDs (`sw_receipt_*`, `mm_post_*`, `hist_summary_*`, `demo_*`) are programmatically rejected from ever being accepted as `LIVE_EVENT` receipts even if passed with `hostAuthProof`.
   - Historical summary badges render **disabled/non-clickable** (`disabled`, `aria-disabled="true"`).
2. **Honest 7-State Participant Status Model (`C1` / `P0.2`):**
   - In `VERIFIED_RECEIPTS` (Historical Proofs) and idle `DEMO_SPECIMEN` modes, all 9 seats default to **`unknown`** (`9 Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`).
   - Diagnostics footer accurately reports the 8-seat runtime breakdown: `4 Mode-A · 2 Pattern-B · 2 Direct-MCP`.
3. **Fail-Closed `LIVE_READONLY` Default & `SwitchCoreBridge` Proxy Boundary (`C2` & PR #15):**
   - `SwitchCoreBridge` binds strictly to `/api/council/live-history` (`scripts/serve_council_live.py` -> Switch Core `GET /agents/{id}/rooms/{room}/history` server-side) and never assumes a direct browser `/rooms/{id}/events` route.
   - The live history proxy enforces exact `sw_<32 hex>` Core event ID validation, rejects inferred IDs from message bodies, separates Mattermost 26-char post IDs from Switch event IDs, and binds strictly to loopback (`127.0.0.1`).
   - Selecting `LIVE_READONLY` defaults immediately to **`[LIVE NOT CONNECTED]` / `LIVE PREVIEW UNAVAILABLE`** (`nexusStatus = "NOT CONNECTED"`, `transportState = "disconnected"`) and withholds historical fixtures.
4. **Six-Category Evidence Separation & Fail-Closed Human Decision Gate (`C2`):**
   - `buildEvidenceModel` explicitly separates `HISTORICAL_READINESS_SUMMARY`, `LIVE_COUNCIL_ASSESSMENT`, `DEMO_SPECIMEN_ASSESSMENT`, `ORCHESTRATOR_RECONCILIATION`, `HUMAN_DECISION_RECORD`, and `WORKFLOW_COMPLETENESS_STATUS` (`INCOMPLETE_WORKFLOW_AWAITING_LIVE_DELIBERATION_AND_DECISION`).
   - Only a `hostAuthProof`-verified live decision event with `authenticated_principal === "jay"`, non-placeholder `source_msg_id`, matching `proposal_correlation_id`, and an explicit uppercase verdict in `{"APPROVED", "DECLINED", "DEFERRED"}` unlocks the human decision gate.
5. **Functional Mattermost Plugin Mount & Local-Harness Distinction (`C3`):**
   - Both the RHS component (`createRHSComponent`) and the Root Chamber Overlay (`createRootOverlayComponent` inside `#mmPluginChamberRootMount`) mount real interactive React components (9-seat circular ring, Redux channel post stream, fail-closed decision gate, and `navigateToChannelPostDom` post-to-source highlighting).
   - `ui/mm-harness.html` is explicitly labeled `⚠️ LOCAL MATTERMOST v12.0.1 PLUGIN HOST HARNESS (OFFLINE SIMULATION — PRODUCTION SERVER INSTALL UNVERIFIED)`. Production Mattermost installation remains gated on explicit human sysadmin approval.
6. **Vercel Static Deployment & Zero-Leak Guarantee (Goal 3):**
   - `vercel.json` provides strict security headers (`nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`) and path rewrites routing root traffic to `/ui/index.html`.
   - The entire `ui/` frontend is 100% self-contained with zero external CDN dependencies (system font stack, local PNG portraits + SVG fallbacks).
   - Zero private bearer tokens, session cookies, LAN IPs, or room UUIDs exist in public browser bundles.

---

## 3. Unified End-to-End Verification Runner (9 Suited Gates)
Run from repository root:
```bash
python scripts/run_all_ui_checks.py
```
Verified suites:
1. `Public Hygiene & Orocue Gate` (`scripts/verify_repo.py`)
2. `Avatar Portraits, Fallbacks & JSON Schema Gate` (`scripts/test_ui_assets.py`)
3. `Accessibility, Focus Trap, Reduced Motion & XSS Gate` (`scripts/test_ui_hardening.py`)
4. `Mattermost 12.0.1 WebApp Plugin Shell Gate` (`scripts/test_mm_plugin.py`)
5. `Event Adapter, Honest 7-State & Safe Renderer Gate` (`scripts/test_event_adapter.py`)
6. `Live History Bridge Core-ID & Provenance Gate` (`scripts/test_live_bridge.py` — 11 unit tests)
7. `Vercel Static Frontend & Asset Packaging Gate` (`scripts/test_vercel_static_config.py`)
8. `Evidence & Decision Panel & Truthful Human Gate` (`scripts/test_evidence_panel.py`)
9. `Headless Chrome 5-Viewport Matrix & Screenshot Gate` (`scripts/test_browser_matrix.js` — 5 viewports)

---

## 4. Operator Runbook & Live Capture Guide
1. **Local Preview / Demo Capture:**
   - Launch: `python scripts/serve_council_live.py` (served on `http://127.0.0.1:8080`).
   - Browser: Open `http://127.0.0.1:8080/` or `ui/index.html` directly in Chrome.
   - Operator Controls: Press `Alt+O` or click `🎥 Operator Mode` to activate Boons Camera Director Bar. Step deterministically turn-by-turn with `▶ Next Turn`.
2. **Mattermost WebApp Plugin Host Harness:**
   - Open `http://127.0.0.1:8080/mm-harness.html`.
   - Click `Council Evidence` in channel header to inspect the RHS Evidence Sidebar.
   - Click `Council Chamber` in channel header to toggle the full 9-seat Council Chamber Root Overlay.
   - Click any cited post row to verify source highlighting (`#mm-post-row-<id>`).
3. **Rollback Plan:**
   - Revert to prior baseline at any time: `git checkout 2ea95b24` (`work/gem-ui-hardening`).
   - Revert to C4 baseline: `git checkout gem/council-ui/c4-verification-handoff`.
