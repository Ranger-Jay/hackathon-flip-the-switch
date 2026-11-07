# Council Chamber UI & Mattermost Integration Manifest

## 1. Source Reconciliation & Baseline Inventory

| Repository | Branch | Baseline / Reference SHA | Purpose |
| :--- | :--- | :--- | :--- |
| `hackathon-flip-the-switch` (public) | `work/gem-interface` | `d237b142f6eb56f6e085947ea4fd59f1bbc6d7a8` | Accepted responsive chamber & avatar layout baseline |
| `hackathon-flip-the-switch` (public) | `work/gem-ui-hardening` | `2ea95b24b4179bb412495fcfe2a59a0e38dc9f3d` | Slice 1 runtime hardening (WCAG modal focus trap, reduced-motion guard, AbortController, XSS-safe DOM rendering) |
| `hackathon-flip-the-switch` (public) | `work/gem-council-chamber` | `bd1a9b94ca041e22d3224c68ca297cbe573bcfe5` (6-slice base) + `C1`–`C4` | Full Council Chamber UI/UX, Mattermost 12.0.1 plugin, and C1–C4 provenance/truthfulness hardening |
| `switch-private` (private) | `agents/gem-ui-hardening` | `cc60c91cad8cc03f997524d72fdeefd222dd3a59` | Private operational mirror of Slice 1 runtime hardening |
| `switch-private` (private) | `agents/gem-council-chamber` | `3528aaff66af6d227327870f8906c5eacc5ce317` (6-slice base) + `C1`–`C4` | Private operational mirror with host configuration mapping |

All hardening guarantees from `2ea95b24` / `cc60c91c` are strictly preserved and regression-tested on every slice:
- Dialog focus entry (`closeProfileBtn.focus()`), Tab/Shift+Tab focus wrap (`handleModalFocusTrap`), `Escape` dismissal, and opener focus restoration (`lastActiveElement.focus()`).
- Runtime `matchMedia('(prefers-reduced-motion: reduce)')` listener stopping `requestAnimationFrame` (`cancelAnimationFrame`) and rendering a static frame.
- `AbortController` cancelling in-flight workflow simulation timers on Reset without orphan callbacks.
- Safe DOM node construction (`document.createElement` + `textContent`) preventing untrusted HTML/script execution.

---

## 2. Deployed Mattermost Server Verification (Empirical Facts)

Verified against the deployed Mattermost server (`v12.0.1`, Build `39742891057`, Build Hash `987e57120dca630dadbcd2638064ab66a02bb81e`, Build Date `Thu Oct 22 08:14:33 UTC 2026`):

### 2.1 Security & Framing Headers
- `Content-Security-Policy: frame-ancestors 'self' ; script-src 'self'`
- `X-Frame-Options: SAMEORIGIN`
- `PluginsEnabled: "true"`

Because `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` are enforced by the server, embedding Mattermost inside an external cross-origin `<iframe>` is blocked by default. In accordance with project security rules, we **do not** weaken framing or CSP headers; instead, we extend Mattermost natively through its WebApp Plugin architecture while keeping the standalone preview and plugin host harness available for local verification and demo capture.

### 2.2 Confirmed WebApp `PluginRegistry` APIs in Mattermost 12.0.1
Extracted directly from the deployed server's active `/static/main.611ed40447cf94b26233.js` and active plugin bundles (`mattermost-ai` v2.9.0, `com.mattermost.calls` v1.12.5):
- `window.registerPlugin(pluginId, pluginInstance)` — primary plugin mount point (`initialize(registry, store)`).
- `registry.registerChannelHeaderButtonAction(icon, action, dropdownText, tooltipText)` — adds the **Council Evidence** and **Council Chamber** action buttons to the channel header.
- `registry.registerRightHandSidebarComponent(component, title)` — registers the expandable **Council Evidence & Decision Panel** in the Right-Hand Sidebar (RHS) and returns `{ id, showRHSPlugin, hideRHSPlugin, toggleRHSPlugin }`.
- `registry.registerRootComponent(component)` — registers the full-viewport **9-Seat Council Chamber Overlay** directly inside the Mattermost root DOM via `React.createElement` so operators can switch between the standard channel stream, the RHS Evidence Panel, and the 9-seat Council Chamber without leaving the `switch/council` channel.
- `registry.registerPostActionComponent(component)` — links individual channel posts into the Evidence Panel and highlights/scrolls to cited source rows (`navigateToChannelPostDom`).
- `registry.registerWebSocketEventHandler(event, handler)` — subscribes to live channel `posted` events.
- `registry.registerReducer(reducer)` — manages plugin state inside the Mattermost Redux store.

### 2.3 Local Harness vs. Production Server Installation Gate
- **Confirmed Local Build & Harness:** The plugin (`com.switch.council-chamber`) compiles deterministically via `mattermost-plugin-council/build_plugin.py` into:
  - `mattermost-plugin-council/webapp/dist/main.js`
  - `ui/plugin-bundle.js`
  - `mattermost-plugin-council/dist/com.switch.council-chamber-0.1.0.tar.gz`
  It mounts and is verified in our local Mattermost 12.0.1 `PluginRegistry` host harness (`ui/mm-harness.html`, labeled `⚠️ LOCAL MATTERMOST v12.0.1 PLUGIN HOST HARNESS (OFFLINE SIMULATION — PRODUCTION SERVER INSTALL UNVERIFIED)`).
- **Production Install Gate (Not Yet Executed on Live Server):** Uploading and enabling a new plugin bundle on the live Mattermost host (`:8065`) requires Mattermost `sysadmin` privileges (`POST /api/v4/plugins` or filesystem deploy under `/opt/mattermost/plugins`) and explicit human lead authorization. Passing local harness checks does **not** establish production server installation.

---

## 3. Event Adapter & Evidence Provenance Contract (`ui/contracts/council-event-schema.json`)

Shared contract with the Track 01 demonstration and bridge track:
1. **Explicit Operating Modes (`OperatingMode`):**
   - `DEMO_SPECIMEN`: Offline Track 01 specimen simulation (`[DEMO SPECIMEN — NOT LIVE EVIDENCE]`).
   - `VERIFIED_RECEIPTS`: Displays curated historical Nov 5–6 seat-steer proof summaries (`[HISTORICAL SEAT-STEER PROOFS — OFFLINE SNAPSHOT]`), retaining real recorded Switch event IDs (`sw_e3abd2912ee949338cfd0ce4a4a6a00f` for Gem Pattern-B and `sw_9f3f6de5d9774c43914093ae1be5187e` for Finch Direct-MCP) and `hist_summary_*` identifiers elsewhere. Historical summary badges are disabled/non-clickable unless backed by a verified live source event, and all seat statuses default to `unknown` (`9 Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`).
   - `LIVE_READONLY`: Connects strictly through the local read-only host proxy (`/api/council/live-history` served by `scripts/serve_council_live.py`, which bridges to Switch Core `GET /agents/{id}/rooms/{room}/history` server-side without exposing bearer tokens in browser code). Defaults fail-closed to `[LIVE NOT CONNECTED]` / `LIVE PREVIEW UNAVAILABLE` and withholds historical fixtures whenever the proxy is inactive.
2. **Six-Category Evidence Separation (`EVIDENCE_CATEGORIES` in `ui/evidence-panel.js`):**
   - `HISTORICAL_READINESS_SUMMARY` — Nov 5–6 engineering/seat readiness summaries (never presented as live deliberation on the Funding Intelligence business proposal).
   - `LIVE_COUNCIL_ASSESSMENT` — Verified live agent assessments on the active proposal.
   - `DEMO_SPECIMEN_ASSESSMENT` — Offline demonstration specimen turns.
   - `ORCHESTRATOR_RECONCILIATION` — Buddy Main's verified live reconciliation vs. curated readiness synthesis.
   - `HUMAN_DECISION_RECORD` — Fail-closed human authorization gate requiring authenticated `jay` principal, non-placeholder `source_msg_id`, matching `proposal_correlation_id`, and explicit verdict in `{"APPROVED", "DECLINED", "DEFERRED"}`.
   - `WORKFLOW_COMPLETENESS_STATUS` — Explicitly reports `INCOMPLETE_WORKFLOW_AWAITING_LIVE_DELIBERATION_AND_DECISION` until live proposal deliberation, live reconciliation, and Jay's live decision are recorded.
3. **Honest 7-State Seat Status (`HonestSeatStatus`):**
   - `listening`, `receiving`, `responding`, `busy`, `stale`, `offline`, `unknown`.

---

## 4. Feature Slice & Corrective Slice Delivery Plan

| Slice | Tag | Scope | Rollback Command |
| :--- | :--- | :--- | :--- |
| Baseline | `2ea95b24` / `cc60c91c` | Hardened UI baseline (`work/gem-ui-hardening`) | `git checkout work/gem-ui-hardening` |
| Slice 1–6 | `gem/council-ui/slice-1-manifest` .. `slice-6-handoff` | Original 6-slice Council Chamber UI/UX & Mattermost plugin (`bd1a9b94` / `3528aaff`) | `git checkout gem/council-ui/slice-6-handoff` |
| Slice 7 | `gem/council-ui/slice-7-p0-truth-hardening` | Initial P0/P1/P2 truthfulness hardening (`8ff7345d` / `9e87494c`) | `git checkout gem/council-ui/slice-7-p0-truth-hardening` |
| Corrective C1 | `gem/council-ui/c1-evidence-status-truth` | Placeholder-ID live rejection guard, curated historical summary provenance, `UNKNOWN` default seat status | `git checkout gem/council-ui/c1-evidence-status-truth` |
| Corrective C2 | `gem/council-ui/c2-live-transport-human-gate` | `SwitchCoreBridge` read-only proxy binding, fail-closed `LIVE_READONLY`, 6-category separation & strict human verdict gate | `git checkout gem/council-ui/c2-live-transport-human-gate` |
| Corrective C3 | `gem/council-ui/c3-mattermost-functional-integration` | Native React 9-seat Root Chamber Overlay + RHS mount in `plugin-bundle.js`, post-to-source DOM highlight navigation | `git checkout gem/council-ui/c3-mattermost-functional-integration` |
| Corrective C4 | `gem/council-ui/c4-verification-handoff` | Behavioral negative tests, refreshed multi-viewport & harness screenshots, and reconciled documentation handoff | `git checkout gem/council-ui/c4-verification-handoff` |
