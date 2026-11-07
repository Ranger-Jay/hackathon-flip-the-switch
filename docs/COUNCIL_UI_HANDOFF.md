# Council Chamber UI/UX & Mattermost 12.0.1 Integration Handoff

## 1. Executive Summary
This document provides the complete engineering, UX, verification, and operator handoff for the **Switch Council Chamber (`work/gem-council-chamber`)** delivered across six independently reviewable feature slices:

| Slice Tag | Scope | Key Artifacts | Verification Suite |
| :--- | :--- | :--- | :--- |
| `gem/council-ui/slice-1-manifest` | Baseline inventory, Mattermost 12.0.1 surface verification, 9 local PNG portraits + SVG fallbacks, canonical JSON Schema | `ui/avatars/*.png`, `ui/contracts/council-event-schema.json`, `docs/COUNCIL_UI_INTEGRATION_MANIFEST.md` | `python scripts/test_ui_assets.py` |
| `gem/council-ui/slice-2-plugin-shell` | Mattermost 12.0.1 WebApp plugin (`com.switch.council-chamber`), `.tar.gz` generator, host harness | `mattermost-plugin-council/`, `ui/plugin-bundle.js`, `ui/mm-harness.html` | `python scripts/test_mm_plugin.py` |
| `gem/council-ui/slice-3-event-chamber` | Event adapter, 3 operating modes, honest 7-state seat model, XSS-safe markdown/DOM renderer | `ui/event-adapter.js` | `python scripts/test_event_adapter.py` |
| `gem/council-ui/slice-4-evidence-panel` | Source-linked Evidence & Decision Panel, role assessments, reconciliation matrix, truthful human gate | `ui/evidence-panel.js` | `python scripts/test_evidence_panel.py` |
| `gem/council-ui/slice-5-cinematic-polish` | Full UI integration, Boons Operator Presentation Mode, active speaker beam, 5-viewport Chrome verification | `ui/index.html`, `ui/app.js`, `ui/style.css`, `ui/captures/*.png` | `node scripts/test_browser_matrix.js` |
| `gem/council-ui/slice-6-handoff` | Unified verification runner, operator & plugin runbooks, rollback procedures | `docs/COUNCIL_UI_HANDOFF.md`, `scripts/run_all_ui_checks.py` | `python scripts/run_all_ui_checks.py` |

---

## 2. Truthfulness, Security & Boundary Guarantees
1. **Honest 7-State Participant Status Model (`listening`, `receiving`, `responding`, `busy`, `stale`, `offline`, `unknown`):**
   - A connected listener (`listening`) is explicitly labeled as an idle listener and **never** implies active model reasoning.
2. **Explicit Operating Modes (`VERIFIED_RECEIPTS`, `DEMO_SPECIMEN`, `LIVE_READONLY`):**
   - `VERIFIED_RECEIPTS` displays the 9 recorded Switch Council events (`8/8` own-runtime seat-steer proofs + canonical proposal) and locks the human decision gate at `AWAITING HUMAN DECISION (JAY AUTHORIZATION GATE)` until a verified human decision event is ingested.
   - `DEMO_SPECIMEN` runs the offline Track 01 workflow simulation and labels its output `SIMULATED DEMO OUTCOME (NOT LIVE HUMAN AUTHORIZATION)`.
   - `LIVE_READONLY` provides an idempotent (`event_id`-deduplicated) read-only observer boundary with explicit transport state diagnostics (`connected`, `stale`, `denied`, `disconnected`).
3. **Zero Browser-Bundled Credentials:**
   - Privileged agent tokens (`sw_...`), session cookies, and private LAN addresses are strictly excluded from public browser bundles.

---

## 3. Boons Operator Presentation & Camera Guide
To support Track 01 video capture and live demonstration:
1. Open `ui/index.html` (or launch via a local static server) at `1440×900` or `1920×1080`.
2. Click **`🎥 Operator Mode`** in the top navigation bar (or press `Alt+O`).
3. Use the **Boons Camera & Presentation Director Bar**:
   - **`⏮ Start` / `◀ Prev Turn` / `Next Turn ▶`**: Step deterministically through each Council turn at camera pace without racing timers.
   - **`▶ Auto-Play` / `⏸ Pause`**: Run or pause automatic turn progression (cancellable via `AbortController`).
   - **`🎯 Spotlight: ON/OFF`**: Toggle the lower-third Active Speaker Spotlight card showing portrait, role, receipt ID, and turn summary.
   - **`📜 Evidence Drawer`**: Slide open the Evidence & Decision Record panel to showcase the 7 role assessments, tradeoffs, preserved dissent, and human authorization gate.
4. Click **`🔌 MM 12.0.1 Host`** (`ui/mm-harness.html`) to demonstrate the Mattermost v12.0.1 WebApp plugin (`com.switch.council-chamber`) mounted inside the channel header, Right-Hand Sidebar (RHS), and Root Chamber overlay on the same `switch/council` channel.

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
2. **Git Branch Rollback:** Prior approved baselines remain untouched on `work/gem-interface` (`d237b142f6eb56f6e085947ea4fd59f1bbc6d7a8`) and `work/gem-ui-hardening` (`2ea95b24b4179bb412495fcfe2a59a0e38dc9f3d`). Any individual slice can be checked out via its tag (`gem/council-ui/slice-1-manifest` through `gem/council-ui/slice-6-handoff`).

---

## 5. End-to-End Verification Command
Run the complete 7-suite verification gate:
```bash
python scripts/run_all_ui_checks.py
```
