# Durable memory and provenance
GitHub is the durable relay and operational index. Use the private coordination repository for actual work state; the public repository holds reusable rules and sanitized templates. Switch provides the shared live conversation. No Google Drive dependency is required.

## Memory layers
| Layer | Contents | Owner/update rule |
|---|---|---|
| Charter | Roles, policy, identity, bootstrap | Reviewed public commits |
| Human decisions | Scope, permissions, priorities, reversals | Append source-linked decision; human authority |
| Installation | Actual IDs, endpoint references, capability inventory | Cora; private; secrets stored separately |
| Mission ledger | Acceptance, owner, status, leases, artifacts | Named task owner; revision check |
| Runtime checkpoint | Current reasoning state, blockers, next action | One runtime owner |
| Evidence ledger | Commands, SHA, result, timestamp, limitations | Append; independently review material claims |
| Session scratch | Temporary exploration | Disposable; distill before ending |

## Fact contract
Each durable assertion has an ID, value, classification, source, observed_at, author runtime, confidence, verification state, freshness deadline if applicable, and supersedes link. Use timezone-aware UTC timestamps. Never manufacture an expiry or extend freshness merely to make a check pass. Retain exact evidence privately where permissions permit.

Classifications are fact, inference, proposal, decision and unknown. Confidence is not verification. A test result from an older SHA is historical evidence; it is not current-head CI. Prefer a small, current index linked to detailed records over pasting an entire chat into every prompt.

## Anti-overwrite
Write a new immutable checkpoint file for each revision. Change a pointer only with an expected prior revision (compare-and-swap). Git branches and API expected-head checks provide conflict detection. A mismatch means read/reconcile; do not force-push or replace the other writer's state. Room documents may have author-specific editing rights: use an owned document and explicit supersession when required.

A runner writes its own checkpoint. Another runner proposes a correction in a separate record. Shared decisions have one designated steward and append-only proposals. Secrets never belong in prompt bundles, issues, screenshots or test fixtures.

## Consolidation and retention
At a completed mission or context limit, keep goals, approved decisions, verified evidence, unresolved questions, failed approaches with reasons, active dependencies and exact next steps. Archive superseded records with links; keep audit history under the installation's retention policy. No automatic deletion is prescribed. Corrections and deletion requests propagate through indexes and derived summaries; report any inaccessible copies.
