# Feature-by-feature releases and rollback

Each feature is released separately. A release contains the already-accepted baseline plus one bounded feature or correction. We do not hold unrelated features for one bundled release or make a single all-features merge a prerequisite for proving a feature.

## Immutable history
Follow CONTRIBUTING.md: one concern per commit, one unique version per commit and one immutable annotated tag at its exact SHA. Code, regression tests and follow-up documentation take their own scoped revisions. Record VERSION, README current version and newest changelog entry together as release bookkeeping.

A tag preserves the complete repository tree at that commit, not just a patch. A new feature tag therefore includes the accepted baseline it depends on. It does not mean every experimental branch or unfinished feature has been released.

Never move/recycle a tag, rewrite tagged commits, or squash/rebase published version history. Prefer an approved fast-forward that preserves exact tested SHAs. Where branches diverge, prepare and review the specific feature integration/version plan before merging; do not silently reuse an existing version for a new merge SHA. Existing initialization/unversioned work must be recorded transparently, not retroactively disguised.

## Per-feature release record
Record:
- Feature/correction and explicit scope; author, independent reviewer and existing human authority.
- Prior known-good tag/SHA and candidate tag/SHA; dependencies and compatibility.
- Build/configuration or artifact reference, migration requirements and deployment target.
- Exact checks at that revision, actual results, limitations and source-linked evidence.
- Rollout steps, health/behavior acceptance, stop conditions and rollback steps.
- Public-safe release summary and private operational receipt.

A shared release manifest may index independently released features and their dependencies. It is an inventory, not a bundled release requirement. Do not call an unmerged review branch the current main/deployed release.

## Rollback
1. Identify the known-good immutable tag and its exact code/artifact revision.
2. Check compatibility with current data, configuration, schema, credentials and dependent features. Take the approved backup/checkpoint where applicable.
3. Restore/redeploy that known-good artifact/configuration through the authorized procedure; a git tag does not itself change a running service.
4. Verify the recovered feature behavior, health, room continuity and receipt/dedup state. Record the observed result and deployment identity.
5. Preserve failed-build evidence and all tags. If only one feature should be removed while later dependent changes remain, use a reviewed forward revert/correction with its own new version or choose a compatible baseline. Do not blindly rewind data.

Database/schema migrations need their own compatibility/restore plan; an earlier code tag cannot guarantee a safe data rollback. A destructive or irreversible change must be identified before release. Do not claim rollback tested without execution evidence in the relevant environment.

## Verification and authority
Keep read-only pull-request/main checks separate from any tag-writing or deployment job. Never auto-deploy or recreate a tag merely because documentation, a bot receipt or an unrelated feature changed. Honor existing approvals and their exact scope; avoid asking again for authority already granted.

The feature release record distinguishes code published, independently reviewed, approved, merged, deployed, behavior verified and rollback verified. These states are not interchangeable.
