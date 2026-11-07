# Council Chamber UI/UX & Mattermost 12.0.1 Integration Handoff

## 1. Executive Summary
This document provides the complete engineering, UX, verification, and operator handoff for the **Switch Council Chamber (`work/gem-council-chamber`)** delivered across seven independently reviewable feature slices (including the P0/P1/P2 Truthfulness & Provenance Hardening slice):

| Slice Tag | Scope | Key Artifacts | Verification Suite |
| :--- | :--- | :--- | :--- |
| `gem/council-ui/slice-1-manifest` | Baseline inventory, Mattermost 12.0.1 surface verification, 9 local PNG portraits + SVG fallbacks, canonical JSON Schema | `ui/avatars/*.png`, `ui/contracts/council-event-schema.json`, `docs/COUNCIL_UI_INTEGRATION_MANIFEST.md` | `python scripts/test_ui_assets.py` |
| `gem/council-ui/slice-2-plugin-shell` | Mattermost 12.0.1 WebApp plugin (`com.switch.council-chamber`), `.tar.gz` generator, host harness | `mattermost-plugin-council/`, `ui/plugin-bundle.js`, `ui/mm-harness.html` | `python scripts/test_mm_plugin.py` |
| `gem/council-ui/slice-3-event-chamber` | Event adapter, 3 operating modes, honest 7-state seat model, XSS-safe markdown/DOM renderer | `ui/event-adapter.js` | `python scripts/test_event_adapter.py` |
| `gem/council-ui/slice-4-evidence-panel` | Source-linked Evidence & Decision Panel, role assessments, reconciliation matrix, truthful human gate | `ui/evidence-panel.js` | `python scripts/test_evidence_panel.py` |
| `gem/council-ui/slice-5-cinematic-polish` | Full UI integration, Boons Operator Presentation Mode, active speaker beam, 5-viewport Chrome verification | `ui/index.html`, `ui/app.js`, `ui/style.css`, `ui/captures/*.png` | `node scripts/test_browser_matrix.js` |
| `gem/council-ui/slice-6-handoff` | Unified verification runner, operator & plugin runbooks, rollback procedures | `docs/COUNCIL_UI_HANDOFF.md`, `scripts/run_all_ui_checks.py` | `python scripts/run_all_ui_checks.py` |
| `gem/council-ui/slice-7-p0-truth-hardening` | P0/P1/P2 Truthfulness & Provenance Hardening: Curated Historical Proof Summary labels, `Current Online: UNKNOWN` in offline mode, `LIVE NOT CONNECTED` default in `LIVE_READONLY`, fail-closed human decision gate (`hostAuthProof` + strict verdict validation), functional Mattermost RHS/WS mount, public UUID sanitization, and behavioral negative tests | `ui/event-adapter.js`, `ui/evidence-panel.js`, `ui/app.js`, `ui/index.html`, `mattermost-plugin-council/webapp/src/index.js`, `docs/COUNCIL_CHAMBER_WALKTHROUGH.md`, `scripts/serve_council_live.py` | `python scripts/run_all_ui_checks.py` |

---

## 2. Truthfulness, Security & Boundary Guarantees (P0.1 – P0.4 Hardened)
1. **Curated Historical Proof Summaries vs. Live Receipts (`P0.1`):**
   - Historical Nov 5–6 seat-steer records in `VERIFIED_RECEIPT_EVENTS` and `VERIFIED_ROLE_ASSESSMENTS` carry `provenance: "CURATED_HISTORICAL_SUMMARY"` and `source_verified_link: false`, retaining real recorded Switch event IDs (`sw_e3abd2912ee949338cfd0ce4a4a6a00f`, `sw_9f3f6de5d9774c43914093ae1be5187e`) where applicable and `hist_summary_*` elsewhere.
   - Historical summary badges are rendered **disabled/non-clickable** (`disabled`, `aria-disabled="true"`) unless backed by a verified live host-proxy event.
2. **Honest 7-State Participant Status Model (`P0.2`):**
   - In `VERIFIED_RECEIPTS` (Historical Proofs) and idle `DEMO_SPECIMEN` modes, all 9 seats default to **`unknown`** (`9 Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`). Historical proofs from Nov 5–6 never display as current `online` or `listening` status.
   - Diagnostics footer accurately reports the 8-seat runtime breakdown: `4 Mode-A · 2 Pattern-B · 2 Direct-MCP`.
3. **Fail-Closed `LIVE_READONLY` Default (`P0.3`):**
   - Selecting `LIVE_READONLY` defaults immediately to **`[LIVE NOT CONNECTED]` / `LIVE PREVIEW UNAVAILABLE`** (`nexusStatus = "NOT CONNECTED"`, `transportState = "disconnected"`) and withholds historical fixtures so offline records are never mistaken for live traffic.
   - Fault-injection buttons are explicitly prefixed with **`SIMULATE:`** (`SIMULATE: Stale (42s)`, `SIMULATE: 401 Denied`, `SIMULATE: Connected`).
   - Only when `python scripts/serve_council_live.py` responds at `/api/council/live-history` with `verified_by_host_proxy: true` does the view transition to `LIVE CONNECTED`.
4. **Fail-Closed Human Decision Gate (`P0.4`):**
   - `CouncilEventAdapter.prototype.ingestEvent(rawEvent, hostAuthProof)` strips any client-supplied `provenance: "LIVE_EVENT"` unless `hostAuthProof.verified_by_host_proxy === true` and `source_msg_id` matches `/^([a-z0-9]{26}|sw_[0-9a-fA-F]{16,64})$/`.
   - `buildEvidenceModel` validates `trusted_host_verified === true`, `authenticated_principal === "jay"`, valid `source_msg_id`, matching `proposal_correlation_id`, and an explicit uppercase verdict in `{"APPROVED", "DECLINED", "DEFERRED"}`. Missing, empty, or invalid verdicts (`null`, `""`, `"YES"`) or unauthenticated client calls fail closed at **`AWAITING_HUMAN_DECISION`**.
5. **Zero Browser-Bundled Credentials & Public Hygiene (`P2.8`):**
   - Privileged agent tokens, session cookies, private LAN addresses, and private room/channel UUIDs are strictly excluded from public browser bundles and screenshots.

---

## 3. Boons Operator Presentation & Camera Guide
To support Track 01 video capture and live demonstration:
1. Open `ui/index.html` (or launch via `python scripts/serve_council_live.py`) at `1440×900` or `1920×1080`.
2. Click **`🎥 Operator Mode`** in the top navigation bar (or press `Alt+O`).
3. Use the **Boons Camera & Presentation Director Bar**:
   - **`⏮ Start` / `◀ Prev Turn` / `Next Turn ▶`**: Step deterministically through each Council turn at camera pace without racing timers.
   - **`▶ Auto-Play` / `⏸ Pause`**: Run or pause automatic turn progression (cancellable via `AbortController`).
   - **`🎯 Spotlight: ON/OFF`**: Toggle the lower-third Active Speaker Spotlight card showing portrait, role, summary ID, and turn text.
   - **`📜 Evidence Drawer`**: Slide open the Evidence & Decision Record panel to showcase the 7 role readiness summaries, tradeoffs, preserved dissent, and fail-closed human authorization gate.
4. Click **`🔌 MM 12.0.1 Host`** (`ui/mm-harness.html`) to inspect the local Mattermost v12.0.1 WebApp plugin harness (`⚠️ LOCAL MATTERMOST v12.0.1 PLUGIN HOST HARNESS (OFFLINE SIMULATION — PRODUCTION SERVER INSTALL UNVERIFIED)`).

---

## 4. Mattermost 12.0.1 Plugin Build, Installation & Rollback
### Building the Plugin Bundle & Tarball
```bash
python mattermost-plugin-council/build_plugin.py
```
Outputs:
- `ui/plugin-bundle.js` (browser-ready WebApp bundle)
- `mattermost-plugin-council/dist/com.switch.council-chamber-0.1.0.tar.gz` (installable Mattermost 12.0.1 plugin archive)

### Installation (Requires Explicit Human Sysadmin Authorization)
1. In Mattermost System Console → **Plugin Management**, upload `com.switch.council-chamber-0.1.0.tar.gz`, or via REST API:
   `POST /api/v4/plugins` followed by `POST /api/v4/plugins/com.switch.council-chamber/enable`.
2. No Mattermost fork or second Council channel is created; the plugin binds directly to the existing `switch/council` conversation.

### Rollback Instructions
1. **Plugin Rollback:** Disable or remove `com.switch.council-chamber` in Mattermost System Console (`POST /api/v4/plugins/com.switch.council-chamber/disable`). Standard Mattermost channel view remains 100% unaffected.
2. **Git Branch Rollback:** Prior approved baselines remain untouched on `work/gem-interface` (`d237b142f6eb56f6e085947ea4fd59f1bbc6d7a8`) and `work/gem-ui-hardening` (`2ea95b24b4179bb412495fcfe2a59a0e38dc9f3d`). Any individual slice can be checked out via its tag (`gem/council-ui/slice-1-manifest` through `gem/council-ui/slice-7-p0-truth-hardening`).

---

## 5. End-to-End Verification Command
Run the complete 7-suite verification gate:
```bash
python scripts/run_all_ui_checks.py
```
