# Contributing

Thank you for helping build a **single, honest, reproducible** human–AI decision workflow. The hackathon's human entrant is Jay. We welcome useful feedback, but changes must respect the review boundary and upstream Switch licensing.

## Our one-workflow boundary

Scope: one Switch Council Room, one business decision path (**propose → role-based responses → reconcile → human decide → record**). Do not introduce new rooms, unrelated agents, a second workflow or a new infrastructure product.

## Orocue version discipline

1. **One concern per commit**: a feature, a correction, tests, or documentation. A code feature and its subsequent README explanation are **separate revisions**.
2. **One version per commit, one commit per version**. Versions are zero-padded `vNNN.NN`. Example: a milestone `v002.00`, then a documentation change `v002.01`, then an isolated test correction `v002.02`.
3. Each commit subject ends with its exact new version in brackets, e.g. `docs: clarify session evidence [v002.01]`.
4. Update `VERSION`, the newest `CHANGELOG.md` entry and README's `Current repository version` at the same time as the numbered change. This is bookkeeping for that version, not a separate functional concern.
5. Use an **immutable annotated tag** matching that version, pointing to that exact commit. If the tag exists and points elsewhere, **stop and investigate**; never force-move it.
6. Keep the change history real and chronological. Do not squash or rebase already-tagged commits. Review and fast-forward integration must preserve their SHAs; if that is impossible, reconcile the version/release plan *before* any merge.
7. Submit a focused pull request for independent review. **No merge or deployment without the human lead's express approval.**

## Feature releases and rollback

Release each feature/correction separately against an accepted baseline, with its own immutable version and exact-head evidence. Do not bundle unrelated features into one release. The [feature-release and rollback contract](agents/FEATURE_RELEASES.md) specifies dependency, deployment and rollback receipts. A tag identifies code; restoring a running build and compatible data/configuration requires the authorized rollback procedure.

A constrained GitHub Actions workflow on the `orocue/public-foundation` and `work/buddy-agent-memory-package` review branches validates the current revision and attempts to tag it. **Check the actual Actions result and remote tag existence**, rather than assuming success.

## Public writing rules

Public commits, issues and PRs **do not use private agent speaker prefixes**, emoji signatures or internal team coordination language. Speak plainly about the change. Private operational work is tracked outside this repository; never paste it here.

Use descriptive titles, explain the problem and solution, link the exact validation evidence and specify which behaviors are still UNKNOWN.

## Working agreement

- Change only your owned component, or coordinate a boundary change before touching another component.
- Preserve relevant tests and failure paths; add regression tests for behavior changes.
- Never claim a test passed without captured output from the exact commit.
- Provide real provider/room evidence when claiming a native agent has joined.
- Avoid false presence indicators, fake decision results, sample credentials that look real, or screenshots represented as live product evidence.
- Keep the 3D layer optional: keyboard/2D/reduced-motion experience must be complete without WebGL.
- Never commit environment secrets, access keys, tunnel details, customer data or personal data.

Before requesting review, run:

```bash
python3 scripts/verify_repo.py
```

This checks documentation integrity and public hygiene—not the actual Switch runtime. Add the relevant app/build/browser/agent tests once those components exist.

## Pull request handoff

Use the pull request template. Include the exact version and tag, scope, changed files, reproducible commands/outputs, known limitations and independent reviewer. Missing evidence stays UNKNOWN.

## Upstream Switch contributions

Work submitted to [sandbox-quantum/switch](https://github.com/sandbox-quantum/switch) follows **their** contribution, issue-assignment and CLA rules independently. Do not copy upstream code into this repository without respecting its license.
