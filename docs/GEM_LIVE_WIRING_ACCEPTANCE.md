# Council Chamber — Safe Live Wiring Acceptance (Nov 7, 2026)

**Purpose:** integrate Gem's approved nine-seat UI with the one existing Mattermost
Council channel, without treating a local preview or historical fixture as live.
This is a reviewable code/readiness gate, **not a production deployment approval**.

## Source & version
- Base UI branch: `work/gem-council-chamber`, Gem C1–C4 delivery.
- Safety patch branch: `work/buddy-gem-live-bridge-safety`.
- Corrective work: `scripts/serve_council_live.py`; new offline tests
  `scripts/test_live_bridge.py`; wired into `scripts/run_all_ui_checks.py`.
- UI visual design, nine portraits, seat presentation and plugin component
  interface are unchanged.

## Current wiring — what is real
1. `mattermost-plugin-council/webapp/src/index.js` registers a Mattermost
   12.0.1 channel-header action, RHS evidence component, root chamber overlay,
   post action and WebSocket handler. It reads the **existing** channel's posts
   from Mattermost Redux, not a second conversation database.
2. `scripts/serve_council_live.py` is a separate **loopback-only operator
   preview server**, serving `ui/` and read-only history behind its own
   server-side Switch bearer. It is not a Mattermost plugin server component,
   an OAuth callback, a publicly authenticated API, or an auto-wake worker.
3. Switching to `LIVE_READONLY` must fail closed until an authenticated host
   bridge provides genuine Core events; historical summaries and simulated
   transport statuses are not proof of current online agents.
4. Exact Core `sw_<32 hex>` IDs must be present **in authenticated upstream
   event fields**. The proxy must not infer IDs from message bodies or fabricate
   them from timestamps/content; a Mattermost post ID is only displayed if the
   trusted source supplies a distinct 26-character valid post ID. Other
   `own_seat` values are never invented.
5. A direct read-only local preview does not establish the production viewer's
   authorization to use a proxy. No raw Core/MCP/agent bearer token is sent to
   browser JavaScript.

## Offline verification
Run from the repository root:

```bash
python scripts/test_live_bridge.py
python scripts/run_all_ui_checks.py
```

The new bridge suite tests authentic vs missing/invalid IDs, untrusted
ID-like text in post bodies, MM vs Switch IDs, false/unknown `own_seat`,
malformed upstream payloads, missing credentials, rejected Core bearer, and
loopback-only listener. The 8-suite runner also covers existing Gem UI checks.
Record actual command, environment, output and exact SHA. A source commit or
assertion in a report is not equivalent to an executed test.

## Operator staging integration sequence (requires authorized host access)
1. **Read-only preflight (Cora/Allen):** establish deployed Mattermost version
   and whether the existing sysadmin permits plugin upload/install. Inventory
   the expected plugin id `com.switch.council-chamber`. No account, service,
   Tailscale, OAuth, CSP, or permission changes in this preflight.
2. **Independent exact-head review (Finch/Buddy):** compare Gem's C1–C4 source,
   security changes and test results; verify React root/RHS registration,
   keyboard/reduced-motion/error paths and evidence/decision gates.
3. **Bundle validation (Gem):** run
   `python mattermost-plugin-council/build_plugin.py`, check archive contents
   and reproducible hash. **Do not install yet.**
4. **Approved Mattermost install (authorized sysadmin only):** install exactly
   the independently reviewed bundle in staging or approved host; record the
   plugin ID/version, install receipt and rollback/removal steps. No iframe/CSP
   bypass, no new Council room, no added agent model calls.
5. **Authenticated live read path (Cora/Boons):** provide a **server-side
   viewer-authenticated** Mattermost-compatible read-only history bridge for
   the installed plugin, using the existing room. Do **not** publish the local
   loopback preview's `/api/council/live-history` to the internet or mount an
   unauthenticated API. An operator-local preview can be tested independently.
6. **Browser acceptance (Gem + independent Finch):** from a permitted Mattermost
   viewer session, open the existing Council channel, RHS and overlay; display
   one actual current `sw_` event linked to its real matching `mm_post_id`
   if available. For any missing cross-system mapping, show a non-clickable
   receipt, **not** an invented Mattermost link. Test disconnected, 401/403,
   stale, duplicate, replay, mobile and reduced-motion states.
7. **Human approval:** show only Jay's actually authenticated, correlated and
   explicitly stated APPROVED/DECLINED/DEFERRED decision. The Nov 7 meeting
   paused before a complete human decision; do not manufacture its completion.

## Stop / rollback
- If plugin install cannot be authorized, keep the UI in **local harness /
  offline specimen mode**; report the exact access or backend-auth blocker.
- If authenticated live source is unavailable, display `LIVE NOT CONNECTED`,
  do not mark all seats online, do not execute model calls.
- Production plugin uninstall/disable must preserve the original Mattermost
  Council messages, Core event IDs, and audit trail.
- Hold production deployments, spending and credential changes for their own
  explicit authorization.

**Acceptance state as of this note:** source corrections and offline regression
tests prepared on a review branch; production Mattermost installation, valid
server-side viewer-authenticated read bridge, and independent real-browser
acceptance are **UNKNOWN / NOT VERIFIED**.
