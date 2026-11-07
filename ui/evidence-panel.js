/**
 * Switch Council Chamber — Evidence & Decision Panel Engine
 * (Feature Slice 4: Source-Linked Assessments, Reconciliation & Truthful Decision Gate)
 *
 * Aligned with agents/DECISION_TRACE.md and agents/templates/assessment.md:
 * - Public role rationale summaries (never hidden internal chain-of-thought).
 * - Cited source event IDs linking directly to conversation stream cards.
 * - Material options & tradeoffs, assumptions, unresolved risks, and dissent.
 * - Observable action receipts with explicit PASS / PARTIAL / UNRUN / UNKNOWN states.
 * - Truthful Human Decision Gate: never shows a live approval unless a verified human
 *   decision event exists in the ledger; demo approvals are labeled SIMULATED_DEMO_OUTCOME.
 */
(function (root) {
  "use strict";

  var MATERIAL_OPTIONS = [
    {
      id: "OPT-A",
      title: "Option A (Recommended): Strict Evidence, Risk & Owner Gate Before Approval",
      summary: "Require every Council proposal to attach source-linked role assessments, explicit unresolved risks/dissent, a named follow-up owner, and a concrete next action before unlocking the human approval gate.",
      pros: "Prevents rubber-stamp AI summaries, preserves minority dissent, and guarantees reopenable audit provenance.",
      cons: "Adds structured pre-check latency before the human decision step."
    },
    {
      id: "OPT-B",
      title: "Option B: Advisory Summary Without Mandatory Risk/Owner Fields",
      summary: "Allow the orchestrator to present a free-form summary for immediate human approval even when source links or risk disclosures are incomplete.",
      pros: "Faster turnarounds for informal questions.",
      cons: "Loses traceability and risks hiding unverified claims or silent model failures."
    },
    {
      id: "OPT-C",
      title: "Option C: Two-Tier Gate (Fast-Track Routine vs. Full Gate for Architecture/Spend)",
      summary: "Apply the strict evidence gate to architecture, security, and funding decisions while allowing lightweight receipts on routine status checks.",
      pros: "Balances operator ergonomics with strict governance on consequential decisions.",
      cons: "Requires clear classification rules so high-impact decisions are never misrouted."
    }
  ];

  var VERIFIED_ROLE_ASSESSMENTS = [
    {
      seat_id: "finch",
      persona_name: "Finch",
      role: "Runtime & Verification Lead",
      runtime_label: "Direct-Seat Council MCP (Codex)",
      execution_mode: "direct_seat_mcp",
      question_assessed: "Can the Codex principal steer its own seat and verify turn ordering without displacing other sessions?",
      recommendation: "APPROVE_WITH_CONDITIONS",
      rationale_summary: "Direct-seat post and independent history read-back succeeded from original Codex runtime (`own_seat=true`). Sequential coexistence with Buddy Main passed.",
      observations: [
        "Direct post/read confirmed on canonical Council room (`own_seat=true`).",
        "Isolated OAuth login (`jay-finch`) prevented session eviction against Buddy Main."
      ],
      options_tradeoffs: [
        "Option A enforces receipt correlation on every turn; Option B risks accepting unverified listener pulses as reasoning."
      ],
      uncertainties_risks: [
        "Cold-wake latency (~21.5s observed on initial wake) remains above the 5s warm target.",
        "Unattended background wake and 30-day OAuth token refresh lifecycle remain UNKNOWN."
      ],
      dissent_notes: "Insists that listener connectivity (`status: live`) must never be scored as active model reasoning.",
      action_receipts: [
        { label: "Direct-Seat Post & Read-Back", status: "PASS", detail: "finch-hello-world-2026-11-06-01 (own_seat=true)" },
        { label: "Buddy+Finch Coexistence", status: "PASS", detail: "Sequential read/write/read without displacement" },
        { label: "Cold-Wake SLA (<=5s)", status: "PARTIAL", detail: "Warm 2.405s PASS; Cold 21.53s FAIL" }
      ],
      next_owner_action: "Finch & Buddy Main: preserve frozen OAuth config during Track 01 demo capture.",
      source_event_id: "sw_9f3f6de5d9774c43914093ae1be5187e",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    },
    {
      seat_id: "cora",
      persona_name: "Cora",
      role: "Operations Lead & Commander",
      runtime_label: "One-Seat Helper (Mode A / Cursor CLI)",
      execution_mode: "mode_a_oneseat_helper",
      question_assessed: "Are host isolation, SSH boundaries, and Mattermost/Core services stable for the Council workflow?",
      recommendation: "APPROVE_WITH_CONDITIONS",
      rationale_summary: "Host key-only SSH accounts, Switch Core (:8000), and Mattermost 12.0.1 (:8065) are live and verified. Production plugin upload remains gated on explicit human sysadmin approval.",
      observations: [
        "8/8 principals verified steering their own seats from their own runtimes.",
        "Mattermost 12.0.1 serves strict `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`."
      ],
      options_tradeoffs: [
        "Option A keeps deployment and sudo actions behind explicit human gates; Option B risks unreviewed host mutations."
      ],
      uncertainties_risks: [
        "Reboot persistence systemd units (PR #14) are audited in dry-run but held from live install until Jay GO."
      ],
      dissent_notes: null,
      action_receipts: [
        { label: "Cora Own-Runtime Mode-A Prove", status: "PASS", detail: "OWN-PROVE-cora-20261105-162607 (history=HIT)" },
        { label: "Switch Core & Mattermost Health", status: "PASS", detail: "Core HTTP 200 ok; Mattermost 12.0.1 HTTP 200 OK" },
        { label: "Production Plugin Upload", status: "UNRUN", detail: "Held pending explicit Jay sysadmin GO" }
      ],
      next_owner_action: "Cora: keep restored live authentication and Core untouched during demo filming.",
      source_event_id: "hist_summary_cora_20261105",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    },
    {
      seat_id: "gem",
      persona_name: "Gem",
      role: "Creative & UX Lead",
      runtime_label: "Native Antigravity Host",
      execution_mode: "native_acp_host",
      question_assessed: "Does the Council Chamber UI provide truthful live-vs-demo states, WCAG AA accessibility, and Mattermost 12.0.1 plugin compatibility?",
      recommendation: "APPROVE",
      rationale_summary: "Delivered 9 local PNG portraits with vector SVG fallbacks, Mattermost 12.0.1 WebApp plugin shell, honest 7-state seat model, XSS-safe DOM renderer, and source-linked Evidence & Decision panel.",
      observations: [
        "All 9 seats render approved local portraits (`avatars/*.png`) with automatic `onerror` fallback to `avatars/*.svg`.",
        "Mattermost 12.0.1 `PluginRegistry` hooks verified against deployed server bundles."
      ],
      options_tradeoffs: [
        "Option A ensures the UI never displays fabricated human approvals or conflates demo fixtures with live events."
      ],
      uncertainties_risks: [
        "Live browser connects via read-only adapter or Mattermost store; direct browser-to-Core SSE requires proxy/CORS gate."
      ],
      dissent_notes: null,
      action_receipts: [
        { label: "Gem Own-Runtime Pattern-B Prove", status: "PASS", detail: "OWN-PROVE-gem-20261105-164728 (151.2ms, history=HIT)" },
        { label: "UI Hardening & XSS Suite", status: "PASS", detail: "Focus trap, reduced motion, AbortController, XSS block PASS" },
        { label: "Mattermost 12.0.1 Plugin Build", status: "PASS", detail: "com.switch.council-chamber-0.1.0.tar.gz verified" }
      ],
      next_owner_action: "Gem & Boons: align camera-ready presentation mode and source event mapping for Track 01 capture.",
      source_event_id: "sw_e3abd2912ee949338cfd0ce4a4a6a00f",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    },
    {
      seat_id: "boons",
      persona_name: "Boons",
      role: "Bridge & Integration Lead",
      runtime_label: "Custom Bridge / One-Seat Helper",
      execution_mode: "mode_a_oneseat_helper",
      question_assessed: "Can the custom bridge and Track 01 demonstration capture a truthful, evidence-backed decision workflow?",
      recommendation: "APPROVE_WITH_CONDITIONS",
      rationale_summary: "One-seat Mode A helper and custom bridge heartbeat verified (`own_seat=true`). Demo storyboard labels every shot as LIVE, MANUAL-ASSISTED, or DEMO FIXTURE.",
      observations: [
        "Auto-receipt latency measured under 3s bar across 5-sample human and agent runs.",
        "Event adapter contract (`council-event-schema.json`) shared between UI and demo capture track."
      ],
      options_tradeoffs: [
        "Option A aligns directly with the Track 01 judging rubric (30% Switch-central, 25% technical, 25% creativity, 20% presentation)."
      ],
      uncertainties_risks: [
        "Official hackathon page does not state a maximum video length; holding main story to ~3:00.",
        "Awaiting Jay's live Funding Intelligence proposal post to record the live decision sequence."
      ],
      dissent_notes: null,
      action_receipts: [
        { label: "Boons Own-Runtime Mode-A Prove", status: "PASS", detail: "OWN-PROVE-boons-20261105-171733 (history=HIT)" },
        { label: "Auto-Receipt Latency Bar (<=3s)", status: "PASS", detail: "5-sample human + agent verification PASS" },
        { label: "Live Proposal & Decision Capture", status: "UNRUN", detail: "Awaiting Jay's live proposal selection" }
      ],
      next_owner_action: "Boons: capture >=2 authentic agent assessments and Jay's live decision once proposal is posted.",
      source_event_id: "hist_summary_boons_20261105",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    },
    {
      seat_id: "allen",
      persona_name: "Allen",
      role: "Engineering Squad Lead",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      question_assessed: "Are the Council MCP OAuth verifier, cost-gate, and one-seat helpers hardened against unauthorized invocation?",
      recommendation: "APPROVE",
      rationale_summary: "Scoped Council MCP (`post_message` + `read_history` only), Dex `0600` config hardening, per-principal OAuth client isolation, and fail-closed cost-gate are verified.",
      observations: [
        "Isolated Keycloak/Dex browser subjects resolved the Buddy/Finch 401 collision without weakening strict seat verification.",
        "Fail-closed Codex Console cost-gate passes 16/16 unit tests."
      ],
      options_tradeoffs: [
        "Option A preserves strict audience/scope verification rather than weakening auth checks for convenience."
      ],
      uncertainties_risks: [
        "Simultaneous high-concurrency MCP stress testing remains outside current smoke scope."
      ],
      dissent_notes: null,
      action_receipts: [
        { label: "Allen Own-Runtime Mode-A Prove", status: "PASS", detail: "OWN-PROVE-allen-20261105-162512 (history=HIT)" },
        { label: "Fail-Closed Cost Gate (PR #5)", status: "PASS", detail: "16/16 Vitest unit tests PASS" },
        { label: "PR #14 Power-Recovery Kit", status: "PARTIAL", detail: "DRY_RUN PASS; live install held for Jay GO" }
      ],
      next_owner_action: "Allen: stood down to preserve usage while OAuth configuration remains frozen.",
      source_event_id: "hist_summary_allen_20261105",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    },
    {
      seat_id: "bucky",
      persona_name: "Bucky",
      role: "Intelligence & Evidence Auditor",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      question_assessed: "Do all recorded claims trace to immutable event IDs and respect public/private hygiene boundaries?",
      recommendation: "APPROVE",
      rationale_summary: "8/8 seat-steering receipts and dual-principal coexistence audited against Core history. Public branch hygiene checks pass with zero leaked secrets or private speaker prefixes.",
      observations: [
        "Every seat's own-runtime proof has a paired `sw_...` event ID and room history HIT.",
        "`scripts/verify_repo.py` enforces zero private prefixes and zero credential patterns in public files."
      ],
      options_tradeoffs: [
        "Option A enforces CLAIM -> EVIDENCE -> VERIFICATION discipline before any decision is marked ready."
      ],
      uncertainties_risks: [
        "Any unrun check must remain explicitly labeled UNKNOWN or UNRUN in both UI and README."
      ],
      dissent_notes: "Rejects any UI state that shows a green 'APPROVED' badge before a real human decision event exists.",
      action_receipts: [
        { label: "Bucky Own-Runtime Mode-A Prove", status: "PASS", detail: "OWN-PROVE-bucky-20261105-164414 (history=HIT)" },
        { label: "Lane B Threat Model Dual-Check", status: "PASS", detail: "PASS-WITH-NITS (Dex 0600 closed)" },
        { label: "Public Repo Hygiene Gate", status: "PASS", detail: "verify_repo.py PASS (0 secrets, 0 prefixes)" }
      ],
      next_owner_action: "Bucky: verify final demo transcript and decision record citations against Core history.",
      source_event_id: "hist_summary_bucky_20261105",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    },
    {
      seat_id: "charlie",
      persona_name: "Charlie",
      role: "Creatives & Product Squad Lead",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      question_assessed: "Does the workflow meet non-builder operator usability and Track 01 judging traceability?",
      recommendation: "APPROVE",
      rationale_summary: "User acceptance checklist (U1-U10) and mode-a helper ergonomics verified. Operator presentation controls make the 5-step decision story clear to judges in under 3 minutes.",
      observations: [
        "One-seat helper and Chamber UI clearly separate live receipts from demo specimens.",
        "Each workflow stage maps directly to a visible UI state and verifiable receipt."
      ],
      options_tradeoffs: [
        "Option A makes human accountability visible on screen, which is the core differentiator for Track 01."
      ],
      uncertainties_risks: [
        "Third-party fresh-clone reproduction still requires end-to-end walkthrough verification."
      ],
      dissent_notes: null,
      action_receipts: [
        { label: "Charlie Own-Runtime Mode-A Prove", status: "PASS", detail: "OWN-PROVE-charlie-20261105-164326 (history=HIT)" },
        { label: "User Acceptance Matrix (U1-U10)", status: "PASS", detail: "Drafted and aligned with Track 01 rubric" }
      ],
      next_owner_action: "Charlie: score final dry-run and assist Boons on presentation polish.",
      source_event_id: "hist_summary_charlie_20261105",
      source_verified_link: false,
      provenance: "CURATED_HISTORICAL_SUMMARY"
    }
  ];

  var DEMO_SPECIMEN_ASSESSMENTS = [
    {
      seat_id: "finch",
      persona_name: "Finch",
      role: "Runtime & Verification Lead",
      runtime_label: "Codex Native Runtime (Demo Specimen)",
      execution_mode: "demo_fixture",
      question_assessed: "Does the single-room state machine prevent duplicate turn delivery?",
      recommendation: "APPROVE",
      rationale_summary: "Specimen simulation: verified single-room claim slot under Switch protocol rev 8 with stable message ID deduplication.",
      observations: ["Turn-taking state machine enforces one active turn per agent."],
      options_tradeoffs: ["Option A guarantees deterministic turn citations."],
      uncertainties_risks: ["Specimen simulation only; does not measure live cold-wake latency."],
      dissent_notes: null,
      action_receipts: [{ label: "Specimen Turn #2", status: "PASS", detail: "Simulated in-role runtime check" }],
      next_owner_action: "Proceed to Infra & UX checks.",
      source_event_id: "demo_turn_02",
      provenance: "DEMO_FIXTURE"
    },
    {
      seat_id: "cora",
      persona_name: "Cora",
      role: "Operations Lead & Commander",
      runtime_label: "Cursor CLI (Demo Specimen)",
      execution_mode: "demo_fixture",
      question_assessed: "Are host containers and network boundaries isolated?",
      recommendation: "APPROVE",
      rationale_summary: "Specimen simulation: Switch core on port 8000 and Mattermost on 8065 containerized with Tailscale isolation.",
      observations: ["Host key-only SSH preflight simulated clean."],
      options_tradeoffs: ["Option A requires human lead authorization before production changes."],
      uncertainties_risks: ["Simulated specimen environment."],
      dissent_notes: null,
      action_receipts: [{ label: "Specimen Turn #3", status: "PASS", detail: "Simulated preflight check" }],
      next_owner_action: "Await human lead authorization.",
      source_event_id: "demo_turn_03",
      provenance: "DEMO_FIXTURE"
    },
    {
      seat_id: "gem",
      persona_name: "Gem",
      role: "Creative & UX Lead",
      runtime_label: "Antigravity Host (Demo Specimen)",
      execution_mode: "demo_fixture",
      question_assessed: "Are all 9 seats visually distinct and WCAG 2.1 AA accessible?",
      recommendation: "APPROVE",
      rationale_summary: "Specimen simulation: 9-seat circular chamber, high-contrast avatars, keyboard focus trap, and reduced-motion guard active.",
      observations: ["2D/3D dual-mode viewport and sidecar evidence drawer operational."],
      options_tradeoffs: ["Option A pairs every visual indicator with a source turn citation."],
      uncertainties_risks: ["None in specimen mode."],
      dissent_notes: null,
      action_receipts: [{ label: "Specimen Turn #4", status: "PASS", detail: "Simulated UX check" }],
      next_owner_action: "Link turns to Evidence drawer.",
      source_event_id: "demo_turn_04",
      provenance: "DEMO_FIXTURE"
    },
    {
      seat_id: "boons",
      persona_name: "Boons",
      role: "Bridge & Integration Lead",
      runtime_label: "Custom Bridge Shim (Demo Specimen)",
      execution_mode: "demo_fixture",
      question_assessed: "Does the custom shim serialize addressed room events without drop?",
      recommendation: "APPROVE",
      rationale_summary: "Specimen simulation: wire contract verified for addressed inbound event parsing and outbound room message delivery.",
      observations: ["Zero-drop message serialization in test harness."],
      options_tradeoffs: ["Option A preserves correlation IDs end-to-end."],
      uncertainties_risks: ["Simulated specimen turn."],
      dissent_notes: null,
      action_receipts: [{ label: "Specimen Turn #5", status: "PASS", detail: "Simulated bridge check" }],
      next_owner_action: "Hand off to Buddy for reconciliation.",
      source_event_id: "demo_turn_05",
      provenance: "DEMO_FIXTURE"
    }
  ];

  /**
   * Build the complete Evidence & Decision State based on active mode and ingested events.
   * Crucial Truthfulness Rule:
   * - In VERIFIED_RECEIPTS or LIVE_READONLY mode, decision.state is AWAITING_HUMAN_DECISION
   *   unless an explicit human decision event (event_type === "decision", sender_id === "jay",
   *   provenance === "LIVE_EVENT") is present in events!
   * - In DEMO_SPECIMEN mode, when the simulation finishes, decision.state is SIMULATED_DEMO_OUTCOME.
   */
  var ALLOWED_HUMAN_VERDICTS = {
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    DEFERRED: "DEFERRED"
  };

  function isValidLiveDecisionEvent(ev, expectedProposalId, expectedMissionId) {
    if (!ev || typeof ev !== "object") {
      return { valid: false, reason: "EMPTY_EVENT" };
    }
    if (ev.sender_id !== "jay" || ev.event_type !== "decision") {
      return { valid: false, reason: "NOT_JAY_DECISION_EVENT" };
    }
    // 1. Must be verified by trusted host proxy, never unauthenticated client ingestEvent
    if (ev.trusted_host_verified !== true || ev.provenance !== "LIVE_EVENT") {
      return { valid: false, reason: "UNAUTHENTICATED_CLIENT_OR_NON_LIVE_PROVENANCE" };
    }
    if (ev.authenticated_principal !== "jay") {
      return { valid: false, reason: "PRINCIPAL_MISMATCH" };
    }
    // 2. Must carry a real Mattermost 26-char post ID or sw_<hex> event ID
    var msgId = ev.source_msg_id || ev.mm_post_id || "";
    if (!/^([a-z0-9]{26}|sw_[0-9a-fA-F]{16,64})$/.test(String(msgId))) {
      return { valid: false, reason: "INVALID_SOURCE_MSG_ID" };
    }
    // 3. Must match active proposal correlation ID
    var corr = ev.proposal_correlation_id || ev.correlation_id || "";
    if (corr !== expectedProposalId && corr !== expectedMissionId) {
      return { valid: false, reason: "PROPOSAL_CORRELATION_MISMATCH" };
    }
    // 4. Fail-closed verdict check: must be explicit uppercase APPROVED, DECLINED, or DEFERRED
    if (typeof ev.verdict !== "string" || !ALLOWED_HUMAN_VERDICTS[ev.verdict]) {
      return { valid: false, reason: "INVALID_OR_MISSING_VERDICT" };
    }
    return { valid: true, verdict: ALLOWED_HUMAN_VERDICTS[ev.verdict] };
  }

  function buildEvidenceModel(mode, events, demoCompleted) {
    events = events || [];
    var isDemo = (mode === "DEMO_SPECIMEN");

    var proposal = isDemo
      ? {
          proposal_id: "SPECIMEN-PROPOSAL-001",
          mission_id: "council-workflow-001 (Demo Specimen)",
          proposer: "Jay (Human Lead — Simulated Specimen)",
          source_event_id: "demo_turn_01",
          source_verified_link: false,
          question: "Funding Intelligence Agent Bridge architecture v1: establish ONE shared room on Switch connecting human lead and specialized agents, synchronize proposal turn-taking, cite turns directly, and generate immutable room decision documents.",
          status_badge: "DEMO SPECIMEN PROPOSAL",
          provenance: "DEMO_FIXTURE"
        }
      : {
          proposal_id: "WORKFLOW-001-PROPOSAL",
          mission_id: "council-workflow-001",
          proposer: "Jay (Human Lead & Authorizer)",
          source_event_id: "hist_summary_jay_welcome_20261106",
          source_verified_link: false,
          question: "Should a Council decision be marked ready for human approval only when it includes source-linked evidence, unresolved risks, a named follow-up owner and a concrete next action?",
          status_badge: "CANONICAL WORKFLOW QUESTION (ISSUE #10)",
          provenance: "CURATED_HISTORICAL_SUMMARY"
        };

    var validDecisionEvent = null;
    var validVerdict = null;
    var rejectedDecisionReason = null;

    if (!isDemo) {
      for (var i = events.length - 1; i >= 0; i--) {
        var ev = events[i];
        if (ev && ev.sender_id === "jay" && ev.event_type === "decision") {
          var check = isValidLiveDecisionEvent(ev, proposal.proposal_id, proposal.mission_id);
          if (check.valid) {
            validDecisionEvent = ev;
            validVerdict = check.verdict;
            break;
          } else {
            rejectedDecisionReason = check.reason;
          }
        }
      }
    }

    var assessments = isDemo ? DEMO_SPECIMEN_ASSESSMENTS : VERIFIED_ROLE_ASSESSMENTS;

    var reconciliation = {
      orchestrator: "Buddy Main (Architect & Conductor)",
      source_event_id: isDemo ? "demo_turn_09" : "hist_summary_buddy_20261106",
      source_verified_link: false,
      recommended_option: "OPT-A",
      agreement_summary: "All participating seats agree that Council decisions must link to verifiable source events, expose public role rationales rather than hidden chain-of-thought, and preserve human authority as the sole approval gate.",
      dissent_and_tensions: [
        "Finch & Bucky emphasize that SSE/listener connectivity (`status: live`) must never be displayed as active reasoning (`responding`).",
        "Cold-wake latency (~17-21s) vs. warm wake (<3s) and 30-day OAuth refresh lifecycle remain open operational limits."
      ],
      remaining_blockers: isDemo
        ? ["None in offline demo simulation."]
        : [
            "Awaiting Jay's live Funding Intelligence proposal turn and explicit human decision (`APPROVED` / `DECLINED` / `DEFERRED`) in the Council room.",
            "Production Mattermost plugin upload remains gated on explicit human sysadmin approval."
          ]
    };

    var decision;
    if (isDemo) {
      decision = {
        decision_id: demoCompleted ? "SPECIMEN-20261103-01" : "SPECIMEN-PENDING",
        proposal_event_id: "demo_turn_01",
        reconciliation_event_id: demoCompleted ? "demo_turn_09" : null,
        human_decision_event_id: demoCompleted ? "demo_turn_10" : null,
        source_verified_link: false,
        state: demoCompleted ? "SIMULATED_DEMO_OUTCOME" : "AWAITING_DEMO_COMPLETION",
        outcome_label: demoCompleted
          ? "SIMULATED DEMO OUTCOME (NOT LIVE HUMAN AUTHORIZATION)"
          : "DEMO SIMULATION IN PROGRESS / IDLE",
        selected_option: demoCompleted ? "Option A (Simulated Specimen Approval)" : "Pending Demo Run",
        human_authorizer: demoCompleted ? "Jay (Simulated Demo Turn #10)" : null,
        summary: demoCompleted
          ? "Offline demonstration completed. This specimen illustrates the Track 01 output schema and does NOT constitute a live human authorization."
          : "Click 'Run Demo Simulation' or step through turns to preview the specimen decision record.",
        unresolved_risks: [
          "Specimen simulation only — live human approval requires a real room event in VERIFIED_RECEIPTS / LIVE mode."
        ],
        follow_up_owner: "Buddy (Orchestrator) & Gem (UX)",
        next_action: "Switch to Historical Proofs mode to inspect curated Nov 5-6 readiness summaries.",
        provenance: "DEMO_SPECIMEN"
      };
    } else if (validDecisionEvent && validVerdict) {
      decision = {
        decision_id: "DECISION-LIVE-001",
        proposal_event_id: proposal.source_event_id,
        reconciliation_event_id: "hist_summary_buddy_20261106",
        human_decision_event_id: validDecisionEvent.event_id,
        source_verified_link: true,
        state: validVerdict,
        outcome_label: "HUMAN DECISION RECORDED: " + validVerdict,
        selected_option: "Option A: Strict Evidence, Risk & Owner Gate",
        human_authorizer: "Jay (Verified Human Event " + validDecisionEvent.event_id + ")",
        summary: validDecisionEvent.content,
        unresolved_risks: reconciliation.dissent_and_tensions,
        follow_up_owner: "Buddy Main & Boons",
        next_action: "Persist durable decision record and verify fresh-context reopen.",
        provenance: "LIVE_DECISION"
      };
    } else {
      decision = {
        decision_id: "DECISION-PENDING-HUMAN-GATE",
        proposal_event_id: proposal.source_event_id,
        reconciliation_event_id: "hist_summary_buddy_20261106",
        human_decision_event_id: null,
        source_verified_link: false,
        state: "AWAITING_HUMAN_DECISION",
        rejection_reason: rejectedDecisionReason,
        outcome_label: rejectedDecisionReason
          ? "AWAITING HUMAN DECISION (REJECTED INVALID/SPOOFED DECISION: " + rejectedDecisionReason + ")"
          : "AWAITING HUMAN DECISION (JAY AUTHORIZATION GATE)",
        selected_option: "Recommended: Option A (Pending Jay's Decision: Approve / Decline / Defer)",
        human_authorizer: null,
        summary: "8/8 Council seats have historical own-runtime seat-steer proofs from Nov 5–6. The human decision gate is fail-closed and strictly locked until Jay posts an authenticated live Approve, Decline, or Defer decision in the Council room.",
        unresolved_risks: reconciliation.dissent_and_tensions,
        follow_up_owner: "Jay (Human Lead & Authorizer)",
        next_action: "Post live proposal and explicit human decision (Approve / Decline / Defer) in switch/council.",
        provenance: "AWAITING_LIVE_ACTION"
      };
    }

    return {
      mode: mode,
      proposal: proposal,
      options: MATERIAL_OPTIONS,
      assessments: assessments,
      reconciliation: reconciliation,
      decision: decision
    };
  }

  /**
   * Verify that every cited source_event_id in the Evidence Model exists in the provided events list.
   */
  function verifyEvidenceCitations(evidenceModel, events) {
    var eventIds = {};
    (events || []).forEach(function (e) {
      if (e && e.event_id) eventIds[e.event_id] = true;
    });
    var results = [];
    (evidenceModel.assessments || []).forEach(function (a) {
      var hit = Boolean(eventIds[a.source_event_id]);
      results.push({
        seat_id: a.seat_id,
        source_event_id: a.source_event_id,
        verified_in_stream: hit
      });
    });
    return {
      total: results.length,
      verifiedCount: results.filter(function (r) { return r.verified_in_stream; }).length,
      items: results
    };
  }

  /**
   * Safe DOM renderer for the Evidence & Decision Panel
   */
  function renderEvidencePanelDOM(container, evidenceModel, callbacks) {
    if (!container || !evidenceModel) return;
    callbacks = callbacks || {};
    var doc = container.ownerDocument || document;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    function el(tag, className, text) {
      var node = doc.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined && text !== null) node.textContent = String(text);
      return node;
    }

    function makeCitationBtn(eventId, labelText, isVerifiedLink) {
      var btn = el(
        "button",
        isVerifiedLink ? "citation-pill citation-link-btn" : "citation-pill citation-summary-badge",
        labelText || (isVerifiedLink ? ("Verified Source: " + eventId) : ("Summary ID: " + eventId))
      );
      btn.type = "button";
      btn.dataset.eventId = eventId;
      if (!isVerifiedLink) {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
        btn.title = "Curated historical summary identifier (not a clickable live room receipt)";
      } else {
        btn.title = "Jump to verified live source event " + eventId + " in conversation stream";
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (typeof callbacks.onSelectSourceEvent === "function") {
            callbacks.onSelectSourceEvent(eventId);
          }
        });
      }
      return btn;
    }

    var wrapper = el("div", "evidence-panel-root");

    // 1. Truthfulness & Provenance Notice Banner
    var isDemo = evidenceModel.mode === "DEMO_SPECIMEN";
    var banner = el(
      "div",
      isDemo ? "doc-warning-banner banner-demo" : "doc-warning-banner banner-verified"
    );
    var bannerStrong = el(
      "strong",
      null,
      isDemo
        ? "⚠️ DEMO SPECIMEN MODE (NOT LIVE EVIDENCE): "
        : "🛡️ VERIFIED RECEIPT & PUBLIC RATIONALE TRACE: "
    );
    banner.appendChild(bannerStrong);
    banner.appendChild(
      doc.createTextNode(
        isDemo
          ? "Showing simulated Track 01 workflow fixtures for local inspection. Simulated outcomes never count as live human authorization."
          : "Showing public role rationales, cited room receipts, material tradeoffs, and unresolved risks. This is a public audit trail, never hidden internal chain-of-thought."
      )
    );
    wrapper.appendChild(banner);

    // 2. Human Decision Gate Status Card (Top-level visibility)
    var dec = evidenceModel.decision;
    var decCard = el("section", "evidence-section decision-gate-card state-" + dec.state.toLowerCase());
    decCard.setAttribute("aria-label", "Human Decision Gate");

    var decHeader = el("div", "evidence-section-header");
    decHeader.appendChild(el("span", "evidence-step-badge", "STEP 04–05 · HUMAN DECISION GATE"));
    var stateBadge = el("span", "decision-state-pill pill-" + dec.state.toLowerCase(), dec.outcome_label);
    decHeader.appendChild(stateBadge);
    decCard.appendChild(decHeader);

    decCard.appendChild(el("div", "decision-selected-option", dec.selected_option));
    decCard.appendChild(el("p", "decision-summary-text", dec.summary));

    var decMeta = el("div", "decision-meta-row");
    decMeta.appendChild(el("span", "meta-chip", "Record ID: " + dec.decision_id));
    decMeta.appendChild(el("span", "meta-chip", "Owner: " + dec.follow_up_owner));
    if (dec.human_decision_event_id) {
      decMeta.appendChild(makeCitationBtn(dec.human_decision_event_id, "Decision Receipt: " + dec.human_decision_event_id, Boolean(dec.source_verified_link)));
    } else {
      decMeta.appendChild(el("span", "meta-chip chip-locked", "🔒 Locked: Requires Live Human Decision Event"));
    }
    decCard.appendChild(decMeta);

    var decNext = el("div", "decision-next-action", "Next Action: " + dec.next_action);
    decCard.appendChild(decNext);
    wrapper.appendChild(decCard);

    // 3. Proposal Card
    var prop = evidenceModel.proposal;
    var propCard = el("section", "evidence-section proposal-card");
    var propHdr = el("div", "evidence-section-header");
    propHdr.appendChild(el("span", "evidence-step-badge", "STEP 01 · PROPOSAL & MISSION SCOPE"));
    propHdr.appendChild(makeCitationBtn(prop.source_event_id, prop.source_verified_link ? ("Verified Source: " + prop.source_event_id) : ("Summary Ref: " + prop.source_event_id), Boolean(prop.source_verified_link)));
    propCard.appendChild(propHdr);
    propCard.appendChild(el("h4", "proposal-question", prop.question));
    var propMeta = el("div", "proposal-meta");
    propMeta.appendChild(el("span", "meta-chip", "Proposer: " + prop.proposer));
    propMeta.appendChild(el("span", "meta-chip", "Mission: " + prop.mission_id));
    propMeta.appendChild(el("span", "meta-chip", prop.status_badge));
    propCard.appendChild(propMeta);
    wrapper.appendChild(propCard);

    // 4. Material Options & Tradeoffs
    var optSection = el("section", "evidence-section options-section");
    var optHdr = el("div", "evidence-section-header");
    optHdr.appendChild(el("span", "evidence-step-badge", "MATERIAL OPTIONS & TRADEOFFS"));
    optSection.appendChild(optHdr);

    (evidenceModel.options || []).forEach(function (opt) {
      var oBox = el("div", "option-card");
      oBox.appendChild(el("div", "option-title", opt.title));
      oBox.appendChild(el("p", "option-summary", opt.summary));
      var tradeRow = el("div", "option-tradeoffs");
      tradeRow.appendChild(el("span", "tradeoff-pro", "✓ Pros: " + opt.pros));
      tradeRow.appendChild(el("span", "tradeoff-con", "△ Tradeoff: " + opt.cons));
      oBox.appendChild(tradeRow);
      optSection.appendChild(oBox);
    });
    wrapper.appendChild(optSection);

    // 5. Role Assessments & Action Receipts (Expandable Cards) — P1.6 Explicit Readiness Summary Labeling
    var assessSection = el("section", "evidence-section assessments-section");
    var assessHdr = el("div", "evidence-section-header");
    assessHdr.appendChild(
      el(
        "span",
        "evidence-step-badge",
        isDemo
          ? "STEP 02 · DEMO SPECIMEN ROLE ASSESSMENTS (" + evidenceModel.assessments.length + ")"
          : "STEP 02 · CURATED ENGINEERING READINESS SUMMARIES (" + evidenceModel.assessments.length + " ROLES — NOT LIVE PROPOSAL DELIBERATION)"
      )
    );
    assessSection.appendChild(assessHdr);
    if (!isDemo) {
      var readinessNotice = el(
        "div",
        "doc-warning-banner banner-verified",
        "Note: These 7 cards are curated engineering readiness summaries compiled from Nov 5–6 seat-steering & infrastructure checks. They do not represent live multi-agent deliberation on the Funding Intelligence business proposal."
      );
      assessSection.appendChild(readinessNotice);
    }

    (evidenceModel.assessments || []).forEach(function (item, idx) {
      var card = el("div", "assessment-card" + (idx < 2 ? " expanded" : ""));
      card.dataset.seatId = item.seat_id;

      var topBar = el("div", "assessment-card-top");
      topBar.setAttribute("tabindex", "0");
      topBar.setAttribute("role", "button");
      topBar.setAttribute("aria-expanded", idx < 2 ? "true" : "false");

      var leftInfo = el("div", "assessment-author-group");
      leftInfo.appendChild(el("strong", "assessment-persona", item.persona_name));
      leftInfo.appendChild(el("span", "assessment-role", item.role));
      leftInfo.appendChild(el("span", "assessment-runtime-chip", item.runtime_label));
      topBar.appendChild(leftInfo);

      var rightInfo = el("div", "assessment-badges-group");
      rightInfo.appendChild(el("span", "rec-badge rec-" + item.recommendation.toLowerCase(), item.recommendation));
      rightInfo.appendChild(makeCitationBtn(item.source_event_id, item.source_verified_link ? item.source_event_id : ("Summary: " + item.source_event_id), Boolean(item.source_verified_link)));
      topBar.appendChild(rightInfo);

      var details = el("div", "assessment-card-details");
      details.appendChild(el("div", "assessment-question", "Q: " + item.question_assessed));
      details.appendChild(el("p", "assessment-rationale", item.rationale_summary));

      if (item.dissent_notes) {
        var dissentBox = el("div", "assessment-dissent-callout");
        dissentBox.appendChild(el("strong", null, "⚡ Dissent / Boundary Condition: "));
        dissentBox.appendChild(doc.createTextNode(item.dissent_notes));
        details.appendChild(dissentBox);
      }

      if (item.uncertainties_risks && item.uncertainties_risks.length > 0) {
        var riskTitle = el("div", "assessment-subhead", "Unresolved Risks & Uncertainties:");
        details.appendChild(riskTitle);
        var riskUl = el("ul", "assessment-list risk-list");
        item.uncertainties_risks.forEach(function (r) {
          riskUl.appendChild(el("li", null, r));
        });
        details.appendChild(riskUl);
      }

      if (item.action_receipts && item.action_receipts.length > 0) {
        var rcptTitle = el("div", "assessment-subhead", "Observable Checks & Action Receipts:");
        details.appendChild(rcptTitle);
        var rcptGrid = el("div", "receipts-mini-grid");
        item.action_receipts.forEach(function (rc) {
          var rRow = el("div", "receipt-item status-" + rc.status.toLowerCase());
          rRow.appendChild(el("span", "receipt-status-tag", "[" + rc.status + "]"));
          rRow.appendChild(el("strong", "receipt-label", " " + rc.label + ": "));
          rRow.appendChild(el("span", "receipt-detail", rc.detail));
          rcptGrid.appendChild(rRow);
        });
        details.appendChild(rcptGrid);
      }

      details.appendChild(el("div", "assessment-next-owner", "Next: " + item.next_owner_action));

      function toggleCard() {
        var isExp = card.classList.toggle("expanded");
        topBar.setAttribute("aria-expanded", isExp ? "true" : "false");
      }
      topBar.addEventListener("click", toggleCard);
      topBar.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleCard();
        }
      });

      card.appendChild(topBar);
      card.appendChild(details);
      assessSection.appendChild(card);
    });
    wrapper.appendChild(assessSection);

    // 6. Orchestrator Reconciliation Section
    var rec = evidenceModel.reconciliation;
    var recSection = el("section", "evidence-section reconciliation-section");
    var recHdr = el("div", "evidence-section-header");
    recHdr.appendChild(el("span", "evidence-step-badge", "STEP 03 · ORCHESTRATOR RECONCILIATION"));
    recHdr.appendChild(makeCitationBtn(rec.source_event_id, rec.source_verified_link ? ("Verified Source: " + rec.source_event_id) : ("Summary Ref: " + rec.source_event_id), Boolean(rec.source_verified_link)));
    recSection.appendChild(recHdr);

    recSection.appendChild(el("div", "reconcile-lead", "Synthesized by: " + rec.orchestrator));
    recSection.appendChild(el("p", "reconcile-agreement", rec.agreement_summary));

    var dissTitle = el("div", "assessment-subhead", "Preserved Dissent & Operational Limits:");
    recSection.appendChild(dissTitle);
    var dissUl = el("ul", "assessment-list");
    (rec.dissent_and_tensions || []).forEach(function (d) {
      dissUl.appendChild(el("li", null, d));
    });
    recSection.appendChild(dissUl);

    var blkTitle = el("div", "assessment-subhead", "Active Gate Blockers:");
    recSection.appendChild(blkTitle);
    var blkUl = el("ul", "assessment-list risk-list");
    (rec.remaining_blockers || []).forEach(function (b) {
      blkUl.appendChild(el("li", null, b));
    });
    recSection.appendChild(blkUl);
    wrapper.appendChild(recSection);

    container.appendChild(wrapper);
  }

  var exported = {
    MATERIAL_OPTIONS: MATERIAL_OPTIONS,
    VERIFIED_ROLE_ASSESSMENTS: VERIFIED_ROLE_ASSESSMENTS,
    DEMO_SPECIMEN_ASSESSMENTS: DEMO_SPECIMEN_ASSESSMENTS,
    buildEvidenceModel: buildEvidenceModel,
    verifyEvidenceCitations: verifyEvidenceCitations,
    renderEvidencePanelDOM: renderEvidencePanelDOM
  };

  if (typeof window !== "undefined") {
    window.CouncilEvidencePanelModule = exported;
    window.buildCouncilEvidenceModel = buildEvidenceModel;
    window.renderCouncilEvidencePanelDOM = renderEvidencePanelDOM;
    window.verifyCouncilEvidenceCitations = verifyEvidenceCitations;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);
