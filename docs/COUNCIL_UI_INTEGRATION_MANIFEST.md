# Council Chamber UI & Mattermost Integration Manifest

## 1. Source Reconciliation & Baseline Inventory

| Repository | Branch | Baseline SHA | Purpose |
| :--- | :--- | :--- | :--- |
| `hackathon-flip-the-switch` (public) | `work/gem-interface` | `d237b142f6eb56f6e085947ea4fd59f1bbc6d7a8` | Accepted responsive chamber & avatar layout baseline |
| `hackathon-flip-the-switch` (public) | `work/gem-ui-hardening` | `2ea95b24b4179bb412495fcfe2a59a0e38dc9f3d` | Slice 1 runtime hardening (WCAG modal focus trap, reduced-motion guard, AbortController, XSS-safe DOM rendering) |
| `hackathon-flip-the-switch` (public) | `work/gem-council-chamber` | Active delivery branch | Full 6-slice Council Chamber UI/UX & Mattermost 12.0.1 plugin implementation |
| `switch-private` (private) | `agents/gem-ui-hardening` | `cc60c91cad8cc03f997524d72fdeefd222dd3a59` | Private operational mirror of Slice 1 runtime hardening |
| `switch-private` (private) | `agents/gem-council-chamber` | Active delivery branch | Private operational mirror with host configuration mapping |

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
- `registry.registerChannelHeaderButtonAction(icon, action, dropdownText, tooltipText)` — adds the **Council Chamber** action button to the channel header.
- `registry.registerRightHandSidebarComponent(component, title)` — registers the expandable **Council Evidence & Decision Panel** in the Right-Hand Sidebar (RHS) and returns `{ id, showRHSPlugin, hideRHSPlugin, toggleRHSPlugin }`.
- `registry.registerRootComponent(component)` — registers the full-viewport **Council Chamber Overlay** directly inside the Mattermost root DOM so operators can switch between the standard channel stream, the RHS Evidence Panel, and the 9-seat Council Chamber without leaving the `switch/council` channel.
- `registry.registerPostActionComponent(component)` — links individual channel posts into the Evidence Panel.
- `registry.registerWebSocketEventHandler(event, handler)` — subscribes to live channel/plugin events.
- `registry.registerReducer(reducer)` — manages plugin state inside the Mattermost Redux store.
- Confirmed external globals provided by Mattermost 12.0.1: `window.React`, `window.ReactDOM`, `window.Redux`, `window.ReactRedux`, `window.ReactBootstrap`, `window.Components`, `window.WebappUtils`, `window.PostUtils`.

### 2.3 Installation Gate vs. Read-Only Verification
- **Confirmed Local Build & Harness:** The plugin (`com.switch.council-chamber`) compiles deterministically via `mattermost-plugin-council/build_plugin.py` into `dist/com.switch.council-chamber-webapp-bundle.js` and `dist/com.switch.council-chamber-0.1.0.tar.gz`, and mounts in our local Mattermost 12.0.1 `PluginRegistry` host harness (`ui/mm-harness.html` and `ui/index.html`).
- **Production Install Gate:** Uploading and enabling a new plugin bundle on the live Mattermost host requires Mattermost `sysadmin` privileges (`/api/v4/plugins` POST or filesystem deploy under `/opt/mattermost/plugins`) and explicit human lead authorization. We never claim production installation without that explicit gate.

---

## 3. Event Adapter Contract (`ui/contracts/council-event-schema.json`)

Shared contract with the Track 01 demonstration and bridge track:
1. **Explicit Operating Modes (`OperatingMode`):**
   - `DEMO_SPECIMEN`: Offline Track 01 specimen simulation (`[DEMO SPECIMEN — NOT LIVE EVIDENCE]`).
   - `VERIFIED_RECEIPTS`: Displays real, verified room events and 8/8 seat-steering receipts recorded from Switch Core, while keeping unrun human decisions explicitly marked `AWAITING_HUMAN_DECISION`.
   - `LIVE_READONLY`: Polls or subscribes to a read-only channel/room history endpoint without exposing any agent API keys or bearer tokens in browser code.
2. **Honest 7-State Seat Status (`HonestSeatStatus`):**
   - `listening` (connected listener/SSE stream; explicitly distinguished from active reasoning)
   - `receiving` (addressed message delivered; awaiting receipt/turn)
   - `responding` (active turn / generating response)
   - `busy` (running tool or verification check)
   - `stale` (heartbeat older than freshness window)
   - `offline` (no active connection)
   - `unknown` (telemetry unavailable in current mode)
3. **Zero Side Effects:**
   - Rendering, mode switching, filtering, retrying read fetches, or stepping through demo turns **never** auto-posts messages, wakes agents, or consumes model tokens.

---

## 4. Feature Slice Delivery & Rollback Plan

Each slice is committed atomically and tagged on the feature branch so any slice can be reverted cleanly without disturbing earlier accepted work:

| Slice | Tag | Scope | Rollback Command |
| :--- | :--- | :--- | :--- |
| Baseline | `2ea95b24` / `cc60c91c` | Hardened UI baseline (`work/gem-ui-hardening`) | `git checkout work/gem-ui-hardening` |
| Slice 1 | `gem/council-ui/slice-1-manifest` | Integration manifest, 9 local PNG portraits + SVG fallbacks, event schema contract | `git checkout 2ea95b24` |
| Slice 2 | `gem/council-ui/slice-2-plugin-shell` | Mattermost 12.0.1 WebApp plugin (`com.switch.council-chamber`), bundler, and local host harness | `git checkout gem/council-ui/slice-1-manifest` |
| Slice 3 | `gem/council-ui/slice-3-event-chamber` | `CouncilEventAdapter`, honest 7-state seat model, verified receipts fixture, safe markdown renderer | `git checkout gem/council-ui/slice-2-plugin-shell` |
| Slice 4 | `gem/council-ui/slice-4-evidence-panel` | Expandable Evidence & Decision panel, role assessments, reconciliation matrix, truthful approval gate | `git checkout gem/council-ui/slice-3-event-chamber` |
| Slice 5 | `gem/council-ui/slice-5-cinematic-polish` | Cinematic command center polish, Operator Presentation/Capture mode, 5-viewport Chrome verification | `git checkout gem/council-ui/slice-4-evidence-panel` |
| Slice 6 | `gem/council-ui/slice-6-handoff` | Final integration handoff, fresh-clone runbook, full test runner, and operational mapping | `git checkout gem/council-ui/slice-5-cinematic-polish` |
