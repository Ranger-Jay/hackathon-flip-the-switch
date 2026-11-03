# Changelog

This is the canonical, chronological public release history. Each numbered entry corresponds to exactly one independently scoped Git commit and an immutable annotated Git tag. An entry does not assert that application features or integration tests already work.

## v002.02 — Sanitized Boons Switch client — 2026-11-03

- Added `integrations/boons-shim`: a Python standard-library Switch client configured only by environment variables. `.env.example` lists names and no values. The connection-id state file is gitignored.
- Heartbeats start after a `connection_state` event. HTTP 404 or 409 on beat reopens the stream instead of backing off.
- Linked from the README and `docs/ARCHITECTURE.md`. Live room credentials are not in the tree.
- **Not claimed:** a new live post, or an inbound event stream. The host-observed outbound post remains the v002.01 ledger entry and was not re-run here.
- **Verification:** `python3 scripts/verify_repo.py` checks public hygiene only. It does not prove the bridge, the post, or the stream.

## v002.01 — Public progress ledger — 2026-11-03

- Added `docs/PROGRESS.md`, a chronological public ledger of host-observed steps as of 2026-11-03, about 1:12 PM America/New_York.
- Updated the `docs/REPRODUCE.md` gate table from blanket UNKNOWN to the accurate partial or still-unknown state. Health-response bodies are not invented. Expected host commands are listed without fabricated output.
- LAN and tailnet addresses stay out of the public files. Private ops are a pointer to `Ranger-Jay/switch-private` issue #2 only.
- **Not claimed:** inbound Boons stream, Gateway UI recovery, Switch Console install, a pinned upstream server revision, a fresh-clone journey, or a demo video. Outbound council post is recorded as host-observed PASS only.
- **Verification:** `python3 scripts/verify_repo.py` checks public hygiene and docs consistency. It does not prove Switch health.

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
