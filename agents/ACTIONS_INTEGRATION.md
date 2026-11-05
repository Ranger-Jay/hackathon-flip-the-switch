# Actions → Switch integration investigation
Status: documented integration path; deployed roundtrip UNKNOWN. This package does not activate new polling, live relay credentials, model calls or schedules.

## Relay-only defaults and loop prevention
Switch agents must not privately message one another; their primary duty is to relay task context and receipts to GitHub. The integration must not create private agent conversations or make an agent's status/ACK automatically wake another model.

Require a human-authorized bounded task before invocation. Preserve original source/correlation IDs, suppress own-message echoes and duplicates, and never acknowledge an acknowledgment. Test that a forwarded message or agent-authored receipt cannot create a wake cascade. Until these controls are verified, documentation of the policy is not evidence that deployed adapters enforce it. Human-requested room discussion remains visible and records its outcome in GitHub.

## What is supported upstream
Switch documents authenticated HTTP message posting and addressed agent events. A relay can use POST /agents/{sender_id}/message with room_id and content; it need not hold a persistent connection just to post. Use an agent API key, not the registration token. The sender needs access and the target's addressing policy must permit it. Check installed API version and response shape first.

A connected/addressable host can act on addressed events. A passive session waits until it reads context. Sending a GitHub notification is therefore neither Switch delivery nor a proven provider invocation.

## Proposed installation
Keep the active relay workflow in the PRIVATE coordination repo. Keep shared policy, reviewed helper code and sanitized examples here. Run trusted workflow code from a pinned reviewed revision. The public repo must not relay arbitrary public comments to paid agents.

A standard hosted runner has no automatic route to a private Switch endpoint. Cora should evaluate the existing network path first: a restricted runner already on the private network, an approved authenticated gateway, or a configured private overlay. Do not expose Core unauthenticated to make CI work. Run self-hosted jobs only on trusted private workflow inputs; never execute public PR code with private credentials.

Store SWITCH_BRIDGE_URL and room/sender/target mappings in private environment configuration; store the sender API key as an environment secret. Do not put credentials in URLs, logs, artifacts or git. Use a least-privilege relay identity. Separate GitHub and Switch authentication.

GITHUB_TOKEN belongs to the workflow's repository. It does not automatically access another private repo. Prefer the relay workflow and mission ledger in the same private repo; any cross-repo access requires an explicitly scoped installation token. Automation-generated comments may not retrigger expected workflows when written using GITHUB_TOKEN, so do not rely on a recursive comment chain for ACK processing.

## Wiring checklist
1. Record exact deployed Switch commit/version and bridge API base. Probe /health from the intended runner; the Gateway UI URL is not necessarily the bridge.
2. Verify existing sender/recipient IDs, ownership, room membership, addressing and supported invocation model. Preserve registration and keys.
3. Prepare a non-model receiver or an already authorized test recipient. Do not lift an existing paid-turn hold.
4. Generate a valid wake envelope with scripts/council_package.py. Render only a short bounded message; no shell commands from an issue.
5. Implement the smallest adapter in the existing bridge: authenticate, post, persist response ID and dedup key, redact errors, forbid credential-bearing redirects, timeout, and reconcile ambiguous submission before retry.
6. Prove target ACK and reverse GitHub receipt under the same correlation. Stop/restart the host and replay the exact event once; require one claimed task and a duplicate receipt.
7. Prove a forbidden actor, cancelled task, expired envelope, wrong recipient and private-network outage produce no model call.
8. Independent review before enabling the private workflow. Add event triggers and recovery scheduling only after manual roundtrip proof.

## Example and boundaries
templates/github-wake-dry-run.yml is a copyable manual validation workflow. It accepts no secret and makes no network call. It is deliberately not an enabled relay. The package helper validates and renders envelopes; it is not a Switch client or production queue.

Integration proof must record Action run URL, source event, actual Switch message reference, recipient boot/ACK, GitHub ACK reference, exact code SHA, latency and duplicate behavior. HTTP 2xx alone cannot satisfy it.

Primary sources checked 2026-11-04:
- https://docs.switchagents.ai/switch-rooms/internals/agent-protocol
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/concepts/security/github_token
- https://docs.github.com/en/actions/concepts/runners/private-networking
