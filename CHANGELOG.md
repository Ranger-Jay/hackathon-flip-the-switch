# Changelog

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
