# Mattermost bridge self-echo: why Jay's `admin` posts were invisible to agents

**Discovered:** 2026-11-04, ~10:40 PM ET (Eastern), during the WORKFLOW-001 live-handoff test.
**Found by:** Cora (Company Commander), while investigating why Boons never acknowledged WORKFLOW-001.
**Status:** Root cause confirmed. Fix chosen by Jay (see below); no Core code change, no Core restart.

## Summary

The Mattermost account `admin` does two jobs: it is Switch Core's **Mattermost bridge login**, and for a short time on 2026-11-04 it was also the account Jay posted from. Core's Mattermost adapter deliberately **ignores every post from its own bridge/admin user_id** (a self-echo filter, so Core never answers itself). As a result, anything Jay posted as `admin` was dropped before it reached Core room history, and no agent (including Boons) could see it.

## Timeline (all times ET, 2026-11-04)

1. Jay noticed his Mattermost name showed as "Admin" with no avatar. He was logged in as `admin`, not the human `user` seat.
2. At Jay's request, `admin` was renamed **Jay - Human Admin** with Jay's photo, and the spare human `user` account was **deactivated** (reversible, history kept).
3. Jay posted **WORKFLOW-001** in the Council channel (`@cora @boons ... acknowledge this message by its message ID ...`) from `admin`.
4. Cora found the post only by reading Mattermost directly; it was **missing from Core's agent room history**. Boons never ACKed.
5. ~10:40 PM: root cause identified as the adapter's self-echo filter (below).

## Symptoms

- Jay's post is visible to humans in the Mattermost UI.
- The post is absent from Core's room history for agents.
- Agents that read through Core (e.g. Boons) never respond. No error is logged; the drop is intentional and silent.
- Agent replies (e.g. Cora's ACK) still post normally, which makes the problem look like "one agent is broken" rather than "the human's posts are filtered".

## Root cause

- Core's Mattermost adapter connects **as `admin`** (bridge login).
- In `core/switch_core/bridges/collaboration/mattermost/adapter.py` (Switch Core, on Nexus), inbound post handling returns early for the bridge's own identities, around **L2784** and **L2983**:

  ```python
  if user_id in self._bridge_bot_ids or user_id == self._admin_user_id:
      return
  ```

- This is correct behavior: without it Core would ingest and react to its own relayed messages (echo loops).
- The bug was operational, not in code: a **human** was posting from the **service** account.

## Wrong hypothesis (recorded on purpose)

First guess: "`admin` was never linked into Core as a human, so link it." **Linking `admin` into Core does not fix this.** The filter matches on `user_id == self._admin_user_id` before any human-link lookup matters, so a linked `admin` is still dropped. Only posting from a different account fixes it.

## Fix Jay chose

- **Reactivate** the human Mattermost `user` account as **"Jay - Human Admin"** with Jay's photo; Jay posts from that account.
- **Leave `admin` as the bridge service account** only. Nobody posts from it.
- After the switch, WORKFLOW-001 must be **reposted from the human account** for Boons and other seats to see it.
- No Core code change. No Core restart.

## Implications for Buddy Town

- **Rule: service accounts never speak as people.** The bridge login (`admin`) is reserved for Core. Every human and every agent posts from its own account.
- **Silent drops are the failure mode.** If an agent "ignores" a human, first check which account the human posted from before debugging the agent.
- **Display names lie.** Renaming `admin` to a human name makes the UI look right while Core still treats it as itself. Check the account/user_id, not the label.
- **Test check:** any handoff test (WORKFLOW-xxx, GitHub Actions ↔ Switch round trip) should confirm the triggering post appears in Core room history, not only in the Mattermost UI.
- Possible later hardening (not done): use a dedicated bot account name like `switch-bridge` instead of `admin`, and/or log a debug line when a post is dropped by the self-echo filter.
