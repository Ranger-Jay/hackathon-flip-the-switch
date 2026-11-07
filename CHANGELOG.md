# Changelog

## v005.03 — Mobile chamber visibility and overflow hardening — 2026-11-07

- Corrected the responsive single-column grid to use `minmax(0, 1fr)`, removed the minimum-content width floor, allowed message metadata to wrap and kept chamber/status/legend text within narrow viewports.
- Extended real Chrome viewport tests to check actual visible panel, status, legend and seat bounds. Prior checks only checked document scroll width and incorrectly passed when a 484px child was clipped inside a 390px hidden-overflow page.
- Styling and regression assertions only; no change to role identities, model execution, backend routing or approved desktop visual design.

## v005.02 — Correct localhost routing detection — 2026-11-07

- Corrected over-escaped local-host detection in the MM harness route selection so local `127.0.0.1` and `localhost` continue to resolve `mm-harness.html`; the public hosted root still switches to clean URL `/mm-harness`.
- GitHub's Chrome matrix flagged the regression in v005.01 before production promotion. The immutable v005.01 tag remains preserved, explicitly recording an unpromoted failing build.
- Existing click and navigation tests must pass at this new exact commit before deployment. No unrelated app or host behavior changed.

## v005.01 — Public MM host clean-URL compatibility — 2026-11-07

- Corrected the public Mattermost test-harness button to use Vercel's verified `/mm-harness` route when served from a deployed root, while retaining the local static-server `mm-harness.html` path.
- Added an offline regression assertion that the clean route and local fallback are both configured. The public Council remains open in the original tab and the harness remains clearly labeled offline.
- This version addresses navigation only; no UI redesign, agent model calls, credentials, native plugin installation, or public Core access change.

## v005.00 — Hackathon submission integration — 2026-11-07

- Integrated the previously independent, non-squashed Council agent/MCP release line and Gem's verified Council Chamber UI/plugin branch as one two-parent release milestone, preserving their original commits and immutable historical tags.
- Made a judge-ready public README the canonical entry point with a working Vercel URL, real captured UI, a precise public-vs-live boundary, reproduction commands, test receipts and a clearly reserved YouTube link.
- Preserved the local plugin bundle, frontend and nine-suite Chrome suite; documented the MM Host separate-tab navigation hotfix, real Nov 7 Council demonstration and human business-priority confirmation.
- Kept the scoped MCP host and agent package tests separate from the public static browser; no production plugin install, private Core feed or original-session auto-wake is inferred.
- **Version evidence:** this release requires a passing exact-SHA UI/bridge CI and Orocue gateway/contract CI; annotated tag v005.00 must be created by the version workflow. The video URL will be a later separately tagged documentation revision.

## v004.11

- Opt-in `COUNCIL_AUTH_DIAG=true` logs one secret-free line per auth rejection: timestamp, bearer present, and a category. Acceptance rules are unchanged. Off by default. This is the branch tip, on top of the server runbook. Tag v004.10 is the same patch parented on v004.09 and is not this tip.

## v004.09

- Add the home-env check to the MCP suite. v004.08 introduced the helper and documented 43 tests; this commit is the test that count refers to. The helper still does not start the gateway.

## v004.08

- Add an unprivileged home layout for Buddy and Finch with writes off, paths under the service home, and a check-only helper. Funnel stays unwired. Rollback of a later process is to stop that process. No live start.

## v004.07

- Describe predefined public clients for Buddy and Finch, the ChatGPT callback placeholder, and S256-only discovery. The resource server still has no registration endpoint. Live Dex metadata is unchanged.

## v004.06

- Keep the MCP verifier fail-closed: `aud` must be the resource string, and `openid` does not become `council:read` or `council:write`. Record the Nexus Dex gap for Allen. No live Dex change and no token is issued.

## v004.05

- Bind each Council MCP process to one seat, `buddy` or `finch`, with its own resource URL, OAuth client, Core sender, subject allowlist and state file. Finch cannot reuse the Buddy resource or the shared client, and a token with no client id is denied. Live Dex and Funnel remain unwired.

## v004.04

- Expose only `post_message` and `read_history`. Keep receipt and deduplication internal, and read Switch Core history so a message carries a `sw_` event id and sender. A Mattermost marker does not confirm a write. Live acceptance remains unverified.

## v004.03

- Document the scoped MCP setup, external OAuth prerequisites, configuration/service templates, original-session read/post/receipt acceptance and per-feature rollback. Distinguish the built gateway from an installed ChatGPT connection and preserve unknown live status.

## v004.02

- Correct HTTP resource metadata to advertise read and write scopes while accepting read-only tokens; close the shared upstream client at application shutdown, not at each stateless request. Both defects reproduced before correction; all 35 synthetic MCP tests now pass. Live access remains unverified.

## v004.01

- Add 34 synthetic MCP tests: actual SDK stdio round trip, HTTP JSON-RPC/OAuth/signature and scope checks, fixed identities/room, no DMs/mentions, persistence/concurrent duplicate protection, timeout/cancellation reconciliation and credential-file isolation. These do not establish a live connection.

## v004.00

- Add a fixed-room, fixed-seat Council MCP with stdio and OAuth-protected Streamable HTTP, bounded human-source replies, durable no-resend receipts and pinned dependencies. Extend feature-branch CI. No live deployment or ChatGPT installation is claimed.

## v003.08

- Define source-linked public assessment/decision traces and a reusable assessment template. Separate user-facing rationale, observable evidence and optional provider summaries from private internal reasoning and simulated authorization.

## v003.07

- Specify feature-by-feature releases, immutable tagged history and per-feature dependency/deployment/rollback records. Distinguish a code tag from restoring running services and compatible data.

## v003.06

- Make Switch charter compliance, bounded additional-model invocation, no-DM/no-loop rules and enforcement evidence mandatory. Preserve the distinction between published policy and tested host enforcement.

## v003.05

- Add the human-directed Switch relay policy: no private agent messaging; GitHub is the primary handoff/receipt channel; suppress autonomous conversations, mention/ACK loops and circular forwarding. Align startup, room instructions and integration guidance; deployed enforcement remains unverified.

## v003.04

- Document package usage, verified offline scope, relay integration findings and the deferred Buddy Town diary template. Live integration remains UNKNOWN; no merge, deployment or paid invocation.

## v003.03

- Add 23 semantic regression tests for stale/cancelled/mismatched wake envelopes, receipt correlation, honest sampling state, integrity and non-overwrite behavior. These are offline checks, not live Switch acceptance.

## v003.02

- Add offline package integrity, bootstrap packet, exclusive private-template creation and wake/receipt contract validation. No network or provider execution.

## v003.01

- Add the public-safe Council context package: charter, eight persona profiles, runtime naming, memory provenance, recovery, relay contracts, setup runbooks and private-state templates. Live installation remains unverified.

## v003.00

- Extend immutable version automation to the agent package review branch and run package checks when present. No runtime wake-ups or deployment added.

This is the canonical, chronological public release history. Each numbered entry corresponds to exactly one independently scoped Git commit and an immutable annotated Git tag. An entry does not assert that application features or integration tests already work.

## v002.00 — Conceptual Council Room visual identity — 2026-11-03

- Added a self-contained, original SVG hero illustration presenting a dramatic circular Council Room and recognizable participant seats.
- Integrated the image into the README with accessible alternative text. The illustration is **conceptual artwork**, not a verified product screenshot.
- No new runtime, 3D implementation or live agent session is claimed. Verify Actions and tag before claiming release completion.

## v001.01 — Documentation foundation — 2026-11-03

- Replaced the initialization README with an honest, judge-readable overview of the single Council Room business workflow.
- Added architecture boundaries, workflow contract, reproduction plan, acceptance ledger and demo storyboard.
- Documented Orocue versioning, public contribution hygiene and responsible security reporting.
- **Verification:** Documentation/repository checker must run on this exact commit. No live Switch integration tests are claimed.

## v001.00 — Repository guardrails — 2026-11-03

- Added `VERSION`, ignore/editor standards, zero-dependency public hygiene checker and review-branch GitHub Actions version/tag workflow.
- The workflow is designed to refuse modified tags and require one explicitly named version per commit.
- **Verification:** GitHub Actions execution and immutable tag creation must be confirmed from the actual run; configuration alone does not establish success.

## Before Orocue versioning — Initial repository commit — 2026-11-03

- Original basic README created as repository initialization (commit `956d9f4`).
- This baseline **predates numbered Orocue commits** and was not relabeled or retroactively version-tagged.

### Evidence policy

When an implementation is delivered, record the exact commit SHA, version tag, tests run, observed outputs, reviewer and known limitations. Do not backfill PASS results or rewrite earlier entries to imply tests happened.
