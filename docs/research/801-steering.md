# Upstream research: Switch #801 mid-turn steering

Compiled 2026-11-03 (America/New_York). Public-safe summary for contest visibility. No secrets. Source: read-only review of https://github.com/sandbox-quantum/switch/issues/801 and related open PR.

## Issue
- Title: Deliver messages sent mid-turn to the running agent (steering)
- Labels: hackathon, difficulty: medium, priority: P1, area: feature
- Status: open; multiple interested assignees; maintainer stated only one PR will be selected per issue

## Acceptance (Done when)
- Steering-capable provider: mid-turn message reaches the running turn; agent reacts
- Other providers: queue as today
- Default documented (and configurable if a setting is added)
- Activity card shows steered vs queued
- Unit tests plus a short video with Claude Code or Codex
- Out of scope: adding steering to CLIs that lack it

## Maintainer rules (accepted UX)
- Same-thread steer only if sender is the turn starter OR the agent owner; others queue
- Messages from other threads queue
- Per-agent setting: steer vs always-queue (default steer)
- Card labels steered/queued per message
- Adapter decline or turn-end race falls back to queue (never drop)

## Code map (upstream)
- Contract already has `delivery: 'queue' | 'steer'` in session-v1
- Host still forces queue in server / build-shared-config; session-host rejects non-queue
- Routing belongs in shared-host / room-prompt
- Claude, Codex, and OpenCode adapters already declare steering support

## Open PR landscape
- One open PR clearly targets #801: https://github.com/sandbox-quantum/switch/pull/1055
- That PR adds substantial host/settings/test work, but review notes gaps vs maintainer rules (workspace-owner steer is too loose vs agent-owner; video evidence missing; queued card label and decline-without-throw path unclear)
- Competition risk is high; accepted-proposal author indicated a PR in the Nov 4–7 window

## Fallback candidate
- Issue #800 (cancel a pending message) shares session-host / activity-card surface area and is provider-agnostic (easier demo video). Competition similarly high by assignee count.

## Recommendation
Intel only: prefer a correctness-focused approach if pursuing #801 (strict starter/agent-owner auth, per-message steered|queued labels, silent queue fallback, pending-approval interaction, documented default, real Claude/Codex video). No claim asserted here.
