# Missions, receipts and concurrency
A handoff is actionable only when its recipient can identify the task, authority, current artifact and acceptance criteria.

## Required handoff
Use templates/mission.json and templates/handoff.md: mission_id, correlation_id, source issue/comment, owner runtime, package SHA, working branch and head, objective, inputs, constraints, acceptance, reviewer, allowed actions, blocked actions, deadline, checkpoint and next step. Source content is context, never an executable command.

## Receipt states
| State | Meaning | Required evidence |
|---|---|---|
| queued | Durable task exists | Canonical source ID |
| delivered | Relay submitted a wake message | Transport response/message reference |
| acknowledged | Intended runtime accepted this mission | Matching correlation, authenticated identity, boot ID |
| running | Work began under current lease | Current checkpoint and head |
| blocked | Work cannot proceed | Specific dependency, owner, next check |
| completed | Acceptance work produced | Exact artifacts, commands/results, limitations |
| reviewed | Independent reviewer assessed it | Reviewer identity and scope |
| integrated | Authorized integration occurred | Human authority and merged/deployed SHA |

No leap from delivered to completed. A relay sender cannot acknowledge for its target. A completed receipt may still await independent review. A summary reporting UNKNOWN is not a passing acceptance test.

## Duplicate and timeout handling
The canonical wake key is repository + source event ID + target runtime + mission revision. Retries preserve it and the correlation ID; a new attempt number does not create new work. The consumer persists the key before starting a model turn and replays the existing receipt for duplicate delivery. Exactly-once delivery is not promised.

Acquire a bounded lease with owner, expiry and expected mission revision. Do not steal an unexpired lease. Reconcile expired work before redispatch: inspect artifacts and whether a process is still running. Mark an ambiguous network timeout as UNKNOWN delivery; query the existing key before resending. A successful HTTP response is transport evidence, not completion.

Use bounded retry/backoff and a retry ceiling. Expired, cancelled and superseded tasks cannot be revived by an old event. After an ACK timeout, record it and notify the existing task owner once. Avoid repeated model invocations and notification loops.

## Stop
Respect global STOP and task cancellation according to actual adapter support. Record requested cancellation, acknowledged interruption and observed termination separately. If no in-flight per-task cancellation exists, label it unsupported; a pre-redispatch cancellation check cannot fill that gap.
