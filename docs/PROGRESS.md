# Public progress ledger

**Snapshot:** 2026-11-03, about 1:12 PM America/New_York (ET).

This ledger records steps that were actually reported. It does not turn a host-side observation into an independent reproduction, and it does not invent command output. Where a clock time was reported, it is written below. Other items are dated 2026-11-03 without a finer public timestamp.

Acceptance checks in [TESTING.md](TESTING.md) stay **UNKNOWN** until the artifacts listed there exist (message IDs, screenshots, fresh-clone transcript, video). Commands a fresh reproducer would run, and the gate table, are in [REPRODUCE.md](REPRODUCE.md).

Private operational notes stay in the private repository `Ranger-Jay/switch-private`, issue **#2**. This file does not copy those comments. Agent speaker prefixes are not used here.

LAN addresses and tailnet addresses are omitted on purpose. [SECURITY.md](../SECURITY.md) and [ARCHITECTURE.md](ARCHITECTURE.md) keep host addresses and tailnet details out of the public repository.

## 2026-11-03 — Development host and stack

| Item | Reported fact |
| :-- | :-- |
| Host name | `nexus` |
| Operating system | Linux Mint |
| Switch Core / bridge | Port **8000**, health reported **ok** on the host |
| Mattermost | Port **8065**, reported up |
| Gateway UI | Port **3000** was **down** at an earlier check the same day. It was **not** re-checked for this snapshot. Do not treat it as up. |

**Proven (host-observed):** bridge health was reported ok, and Mattermost was reported up.

**UNKNOWN:** the HTTP response bodies (they are not stored in git); whether Gateway UI port 3000 recovered later; any check from a second machine. Health requests were not re-run for this revision, and no curl output is invented here. SSH from a cloud sandbox to this host was reported blocked; see the next section.

## 2026-11-03 — Reachability and Path A

An SSH attempt from a cloud sandbox to the development host port 22 was reported as **`Operation not permitted`** (outbound TCP blocked). This workspace did not repeat that attempt and does not have an SSH transcript.

**Decision (Path A):** run the Boons session on `nexus` itself. No Hatch relay.

**Proven:** the reported egress failure and the Path A decision.

**UNKNOWN:** whether some other network path can reach the host. Not retested here.

## 2026-11-03 — Council Room bind

| Item | Reported fact |
| :-- | :-- |
| Mattermost team | `switch` |
| Mattermost channel | `council` (the Council Room) |
| Switch room id | `4fac4eab-759d-4fc7-9800-04f6bfa631db` |
| Bind | The Switch room was bound to that channel with `external_channel_id` |

**Proven (host-observed):** the room id and the fact of the bind.

**UNKNOWN:** the Mattermost channel id value itself (not copied here) and a stored transcript of the bind call.

## 2026-11-03 — Boons registration, out of band

The custom agent Boons was registered outside this repository, through the gateway admin registration path. This repository does not contain a registration token, an agent API key, or private key material. Live room credentials are never committed.

**Proven:** registration was completed out of band.

**UNKNOWN / withheld:** the credential values. They are not a public artifact.

## 2026-11-03 — Host-local shim session

A shim process is live on `nexus` (Path A). Its heartbeat was corrected so beats are sent after `connection_state`. An HTTP **404** or **409** on beat means reopen the stream, not back off.

A test post from that session reached Mattermost channel `council`.

**Proven:** **outbound post PASS.** The post was observed in the council channel.

**UNKNOWN:** the inbound event stream into Boons. Honest summary: **outbound post PASS; inbound stream not yet proven.** No inbound message id is recorded here. This cloud workspace did not re-run the post.

The public client that records the corrected heartbeat behavior is a separate revision. It is not evidence that the inbound stream has since succeeded.

## 2026-11-03, about 1:06 PM ET — Switch Console

Finch downloaded a verified Switch Console build, **Windows x64 v0.40.1**, onto the machine named Old-Faithful. That verification is of the downloaded build, not of an installed session. Jay issued **GO** to install and run at about 1:06 PM ET.

**State:** **GO issued; install evidence pending.**

**UNKNOWN:** whether the installer has been run, whether Console has authenticated, and whether any native agent has joined the room. As of this snapshot, no public commit says otherwise. Codex, Antigravity, and Cursor CLI join-and-reply tests are also **UNKNOWN**.

A pinned upstream Switch server revision is still **UNKNOWN**. Console v0.40.1 is a desktop build, not a server pin.

## As of the snapshot — other public work

Branch `work/gem-interface` already contains Council Room interface files ahead of `v002.00`. This branch does not modify that branch. Those commits are not treated here as a verified live Switch session.

## Public repository and private ops

| Surface | What it holds |
| :-- | :-- |
| Public: `Ranger-Jay/hackathon-flip-the-switch` | Judge-facing code and docs. No API keys, registration tokens, private keys, host addresses, tailnet addresses, or agent speaker prefixes. |
| Private: `Ranger-Jay/switch-private` issue **#2** | Operational notes. Pointer only. Comments are not pasted into this file. |
