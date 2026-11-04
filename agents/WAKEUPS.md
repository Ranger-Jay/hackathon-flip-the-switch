# GitHub relay and wake-up contract
The private GitHub issue is the canonical mission and receipt thread. Switch carries live Council discussion and addressed wake messages. The public repository distributes reviewed reusable context. GitHub Actions can bridge events between them; it is not durable agent memory by itself.

## Delivery chain
1. An authorized human or approved integration creates a mission in the private relay.
2. An Action reads the canonical event, checks authorization, target mapping, revision, cancellation and deduplication.
3. It posts a short addressed wake message through the verified Switch bridge API using the relay sender's agent credential.
4. The existing Switch host receives the addressed event and runs the intended recipient only if its capability and spending gates permit.
5. The recipient reads the source, claims its lease, then writes ACK and eventual outcome to the private GitHub thread.

A wake message contains mission/correlation/dedup IDs, target handle, approved public package SHA and private source reference. Avoid copying the full private issue into a different-permission room. Only a runtime that can read that private source should receive it.

## Delivery choices
- Start with manual workflow_dispatch to one controlled recipient; prove the roundtrip.
- Add issue_comment:created for an exact wake command from an allowlisted authenticated actor. Validate issue labels, target and author permissions. Never execute comment text.
- Add repository_dispatch for a trusted external integration only after credential scope is established.
- Add a low-frequency schedule to reconcile unacknowledged eligible tasks, not to awaken every agent indiscriminately. Scheduled Actions can be late or dropped; they are a recovery sweep, not a precise alarm.

Use one existing bridge/host path. Do not add a second watcher or parallel queue. If Switch cannot push to a passive session, retain the pending task for its next explicit check-in. GitHub cannot force a closed ChatGPT tab to wake.

## Evidence and limitations
Transport delivery, recipient ACK, work and completion require different receipts. A relay process can post without being a conversational participant. It must not impersonate Buddy-Switch. Actual local endpoint, host configuration, reachability, addressing permissions and paid invocation approval remain installation checks.

The included workflow is a dry-run template outside .github/workflows. It sends no wake message. Live activation follows CORA_SETUP.md and independent review.

Sources: https://docs.switchagents.ai/switch-rooms/internals/agent-protocol and https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows (checked 2026-11-04).
