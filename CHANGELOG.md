# Changelog

This is the canonical, chronological public release history. Each numbered entry corresponds to exactly one independently scoped Git commit and an immutable annotated Git tag. An entry does not assert that application features or integration tests already work.

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
