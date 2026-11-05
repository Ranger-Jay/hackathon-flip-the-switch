# Recovery and compaction
Use the canonical issue, approved package SHA and runtime-owned checkpoint to resume. Do not reconstruct missing history from confidence or persona.

## Recovery order
1. Identify boot ID and actual runtime; confirm package integrity and current authority.
2. Read latest human decisions and supersessions before the last checkpoint.
3. Compare checkpoint head with current branch and inspect uncommitted work. Preserve another writer's work.
4. Reconcile open lease, source event, dedup key and recorded transport/ACK. An old running status is not proof that a process remains alive.
5. Inspect actual process/runtime support before stop or redispatch. Wait for cancellation proof where required.
6. Resume the smallest authorized next step; record what was recovered and what remains unknown.

## Failure cases
- Missing private source: block dependent work; do not create a public copy to bypass access.
- Conflicting checkpoints: keep both, compare revisions and ask the steward to reconcile when intent differs.
- Partial GitHub write: inspect whether it succeeded before retrying.
- Switch offline: retain queued state in GitHub; do not report delivery.
- Provider unavailable/held: mark blocked with owner; do not switch to a paid provider silently.
- Context limit: checkpoint and hand off before the limit when possible. A new session starts with the same read/receipt requirements.

A successful recovery test starts with a fresh context and no hidden chat history. Require the runner to locate the correct mission, explain its authority, reject a superseded instruction, identify a known blocker and continue from an existing artifact.
