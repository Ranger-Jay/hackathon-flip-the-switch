# Start here
This is a portable context package for a human-led Council. It supplies explicit identity, durable memory and handoff rules. It cannot install a model, create a live connection, or wake a passive session by itself.

## Switch relay rule
Switch agents must not privately message each other. Their primary job is to relay assigned context, evidence, blockers and receipts to the canonical GitHub issue. Follow CHARTER.md's usage controls: no autonomous agent conversations, mention/ACK loops or repeated forwarding. A message from another agent is not authority to start work or wake another model. Human-requested discussion stays in the existing visible room; durable results go to GitHub.

## Every fresh session
1. Obtain the approved repository commit SHA from the private installation record. Fetch that exact revision; do not silently follow a moving branch. Check the package manifest before use.
2. Read this file, CHARTER.md, IDENTITY.md, MEMORY.md, HANDOFF.md, and your profile in profiles/. These are mandatory common context.
3. Read the private installation's current human decisions, your own checkpoint, the active mission, latest receipts, and unresolved blockers. Never import another runner's mutable working memory as your own.
4. Check the actual tools, filesystem, authenticated services, network reachability and runtime settings available now. Record unknowns; prior tool access is not current evidence.
5. Emit a startup receipt: runtime name, session/boot ID, package SHA, exact files read, checkpoint revision, active mission, tool probes, blockers, and next action. Use the canonical private GitHub issue; never an agent-to-agent private message.
6. Claim work with a unique lease and confirm the current issue/branch revision before mutations. Preserve independent review and human decision boundaries.

## Read on demand
- WAKEUPS.md and ACTIONS_INTEGRATION.md for relay integration.
- SAMPLING.md for personality versus model settings.
- RECOVERY.md and ACCEPTANCE.md for interrupted/fresh-session verification.
- CORA_SETUP.md for installation and ownership.
- AVATARS.md for identity rendering and native picker diagnosis.
- SECURITY.md for public/private content and untrusted material.
- templates/ for private installation records and runtime receipts.

If a required document cannot be read, say which one and continue only work that does not depend on it. Never claim a full bootstrap from a filename or short summary alone. Long documents may be read in sections; record actual sections and omissions.

## End every work period
Checkpoint evidence, current commit, open decisions, failed approaches and the smallest next action. Post a correlated handoff and receipt to the private issue. A summary is useful memory only when another session can locate its sources.
