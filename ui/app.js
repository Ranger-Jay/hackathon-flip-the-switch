// Council Chamber — Event-Backed UI, Honest Status Model, Evidence Panel & Operator Mode
// Clean public implementation for Switch Hackathon (Track 01)
const PRIVATE_CFG = (typeof window !== "undefined" && window.__SWITCH_PRIVATE_CONFIG__) || {};
const SWITCH_ROOM_ID = PRIVATE_CFG.roomId || "switch-council-track01";
const MATTERMOST_CHANNEL_ID = PRIVATE_CFG.channelId || "switch-council-channel";

// All 9 Council & Squad Seats with local high-res PNG portraits + SVG fallbacks.
// P0.2 Truthfulness Rule: Historical proofs from Nov 5-6 do NOT mean seats are currently online.
// Default status and honestStatus are strictly "unknown" until live authenticated heartbeat evidence arrives.
const SEATS = [
  {
    id: "jay",
    originalName: "Jay",
    runtimeName: "Jay (Human Lead)",
    role: "Human Lead & Authorizer",
    emoji: "🐕",
    avatar: "avatars/jay.svg",
    photo: "avatars/jay.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "human_authority",
    transportId: "jay",
    description: "Company founder, product visionary, and sole human authorization authority for all Council architecture decisions.",
    hash: "hist_summary_jay_welcome_20261106",
    lastReceiptId: "hist_summary_jay_welcome_20261106",
    honestNote: "Human decision authority. Current live presence: UNKNOWN in offline/historical view. Final approval gate is AWAITING_HUMAN_DECISION."
  },
  {
    id: "buddy",
    originalName: "Buddy",
    runtimeName: "Buddy-Switch",
    role: "Architect & Conductor",
    emoji: "🦅",
    avatar: "avatars/buddy.svg",
    photo: "avatars/buddy.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "direct_seat_mcp",
    transportId: "buddy",
    description: "Chief problem-solver, orchestrator, and synthesizer across all squad roles and evidence matrices.",
    hash: "hist_summary_buddy_20261106",
    lastReceiptId: "hist_summary_buddy_20261106",
    honestNote: "Historical Direct-Seat Council MCP proof recorded Nov 6 (`own_seat=true`). Current live status: UNKNOWN."
  },
  {
    id: "cora",
    originalName: "Cora",
    runtimeName: "Cora-Switch",
    role: "Operations Lead & Commander",
    emoji: "🎖️",
    avatar: "avatars/cora.svg",
    photo: "avatars/cora.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "mode_a_oneseat_helper",
    transportId: "cora",
    description: "Company Commander, operations lead, host infrastructure runtime, and security gating.",
    hash: "hist_summary_cora_20261105",
    lastReceiptId: "hist_summary_cora_20261105",
    honestNote: "Historical One-Seat Mode-A proof recorded Nov 5 (`OWN-PROVE-cora-20261105-162607`). Current live status: UNKNOWN."
  },
  {
    id: "gem",
    originalName: "Gem",
    runtimeName: "Gem-Switch",
    role: "Creative & UX Lead",
    emoji: "💎",
    avatar: "avatars/gem.svg",
    photo: "avatars/gem.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "pattern_b_own_runtime",
    transportId: "gem-seat",
    description: "Art director, pair programmer, and native Antigravity host UI designer. Crafting luminous, truthful human-agent experiences.",
    hash: "sw_e3abd2912ee949338cfd0ce4a4a6a00f",
    lastReceiptId: "sw_e3abd2912ee949338cfd0ce4a4a6a00f",
    honestNote: "Historical Own-Runtime Pattern-B proof recorded Nov 5 (`sw_e3abd2912ee949338cfd0ce4a4a6a00f`, 151.2ms). Current live status: UNKNOWN."
  },
  {
    id: "finch",
    originalName: "Finch",
    runtimeName: "Finch-Switch",
    role: "Runtime & Verification Lead",
    emoji: "🐦",
    avatar: "avatars/finch.svg",
    photo: "avatars/finch.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "direct_seat_mcp",
    transportId: "finch-seat",
    description: "Codex native runtime lead, state-machine verification, and host browser test execution owner.",
    hash: "sw_9f3f6de5d9774c43914093ae1be5187e",
    lastReceiptId: "sw_9f3f6de5d9774c43914093ae1be5187e",
    honestNote: "Historical Direct-Seat Council MCP proof recorded Nov 6 (`sw_9f3f6de5d9774c43914093ae1be5187e`). Current live status: UNKNOWN."
  },
  {
    id: "boons",
    originalName: "Boons",
    runtimeName: "Boons-Switch",
    role: "Bridge & Integration Lead",
    emoji: "🐝",
    avatar: "avatars/boons.svg",
    photo: "avatars/boons.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "pattern_b_own_runtime",
    transportId: "boons-seat",
    description: "Custom shim engineer, wire protocol serialization, and demonstration capture lead.",
    hash: "hist_summary_boons_20261105",
    lastReceiptId: "hist_summary_boons_20261105",
    honestNote: "Historical Own-Runtime Pattern-B proof recorded Nov 5 (`OWN-PROVE-boons-20261105-171733`). Current live status: UNKNOWN."
  },
  {
    id: "allen",
    originalName: "Allen",
    runtimeName: "Allen-Switch",
    role: "Engineering Squad Lead",
    emoji: "🔧",
    avatar: "avatars/allen.svg",
    photo: "avatars/allen.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "mode_a_oneseat_helper",
    transportId: "allen",
    description: "Core systems engineering, fail-closed cost-gate implementation, and service daemon automation.",
    hash: "hist_summary_allen_20261105",
    lastReceiptId: "hist_summary_allen_20261105",
    honestNote: "Historical One-Seat Mode-A proof recorded Nov 5 (`OWN-PROVE-allen-20261105-162512`). Current live status: UNKNOWN."
  },
  {
    id: "bucky",
    originalName: "Bucky",
    runtimeName: "Bucky-Switch",
    role: "Intelligence & Evidence Auditor",
    emoji: "🔭",
    avatar: "avatars/bucky.svg",
    photo: "avatars/bucky.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "mode_a_oneseat_helper",
    transportId: "bucky",
    description: "Independent audit verifier, continuity tracking, and receipt validator against ground-truth logs.",
    hash: "hist_summary_bucky_20261105",
    lastReceiptId: "hist_summary_bucky_20261105",
    honestNote: "Historical One-Seat Mode-A proof recorded Nov 5 (`OWN-PROVE-bucky-20261105-164414`). Current live status: UNKNOWN."
  },
  {
    id: "charlie",
    originalName: "Charlie",
    runtimeName: "Charlie-Switch",
    role: "Creatives & Product Squad Lead",
    emoji: "🎬",
    avatar: "avatars/charlie.svg",
    photo: "avatars/charlie.png",
    status: "unknown",
    honestStatus: "unknown",
    executionMode: "mode_a_oneseat_helper",
    transportId: "charlie",
    description: "Product demonstration storytelling, media asset production, and creative workflow director.",
    hash: "hist_summary_charlie_20261105",
    lastReceiptId: "hist_summary_charlie_20261105",
    honestNote: "Historical One-Seat Mode-A proof recorded Nov 5 (`OWN-PROVE-charlie-20261105-164326`). Current live status: UNKNOWN."
  }
];

const WORKFLOW_SCRIPT = [
  {
    sender: "jay",
    prefix: "Jay (Human Lead):",
    content: "Council proposal for review: Funding Intelligence Agent Bridge architecture v1. We establish ONE shared room on Switch connecting human lead and specialized agents. Objective: synchronize proposal turn-taking, cite turns directly, and generate immutable room decision documents. What are the key checks from each role?",
    delay: 650,
    event_id: "specimen_turn_01"
  },
  {
    sender: "finch",
    prefix: "Finch (Codex Runtime):",
    content: "From Codex Native Runtime: verified single-room claim slot under Switch protocol rev 8. Turn-taking state machine enforces one active turn per agent without duplicate delivery. Verified via stable message ID receipts (`sw_a16c49623fd14e09b8d12c4e9f001122`).",
    delay: 850,
    event_id: "specimen_turn_02"
  },
  {
    sender: "cora",
    prefix: "Cora (Infra & Operations):",
    content: "From Infra & Operations: host key-only SSH pass verified for squad. Switch core on port 8000 and gateway on 3000 containerized. Tailscale isolation verified (`sw_c91823e4a1b249f082c3d4e5f6a7b801`). Preflight passes; awaiting human lead authorization for final stack validation.",
    delay: 850,
    event_id: "specimen_turn_03"
  },
  {
    sender: "gem",
    prefix: "Gem (Creative & UX):",
    content: "From Creative & UX: Council Chamber visual identity locked across all 9 seats with local 176x176 portraits, SVG fallbacks, honest 7-state statuses, and WCAG 2.1 AA typography (`sw_e3abd2912ee949338cfd0ce4a4a6a00f`). 2D/3D dual-mode viewport and Evidence Panel verified.",
    delay: 850,
    event_id: "specimen_turn_04"
  },
  {
    sender: "boons",
    prefix: "Boons (Custom Shim):",
    content: "From Custom Shim: Wire contract drafted for addressed inbound event parsing and outbound room message delivery (`sw_d45109f8b2c348a193e4f5a6b7c8d903`). Operator Presentation Mode ready for Track 01 capture.",
    delay: 800,
    event_id: "specimen_turn_05"
  },
  {
    sender: "allen",
    prefix: "Allen (Engineering):",
    content: "From Engineering: Fail-closed cost-gate implemented in PR #5 (`sw_f12098a7c3d447b284f5a6b7c8d9e004`). Pre-spawn validation asserts non-empty model and effort before executing paid turns. 16/16 Vitest passes clean.",
    delay: 800,
    event_id: "specimen_turn_06"
  },
  {
    sender: "bucky",
    prefix: "Bucky (Auditor):",
    content: "From Independent Evidence Auditor: Continuity ledger verified (`sw_883412b9d4e546c395a6b7c8d9e0f105`). Room history matches recorded events on Switch Core with zero unverified claims. All receipts cross-checked against transcript timestamps.",
    delay: 800,
    event_id: "specimen_turn_07"
  },
  {
    sender: "charlie",
    prefix: "Charlie (Creatives):",
    content: "From Creatives & Product: Demonstration narrative ready (`sw_554321c0e5f645d486b7c8d9e0f1a206`). Track 01 submission deck and interactive chamber viewer validated. Decision record workflow verified for end-to-end capture.",
    delay: 800,
    event_id: "specimen_turn_08"
  },
  {
    sender: "buddy",
    prefix: "Buddy (Orchestrator):",
    content: "Reconciliation and synthesis (`sw_7b9021d4c8e144a091f2a3c4d5e6f702`): Runtime (Finch), Infra (Cora), UX (Gem), Shim (Boons), Engineering (Allen), Audit (Bucky), and Product (Charlie) are aligned with zero cross-dependency deadlock. Proposal meets Track 01 standards. Recommendation to Jay: APPROVE Option B.",
    delay: 900,
    event_id: "specimen_turn_09"
  },
  {
    sender: "jay",
    prefix: "Jay (Simulated Demo Outcome):",
    content: "[SIMULATED DEMO SPECIMEN] Recommendation accepted for offline Track 01 schema demonstration. Buddy, generate specimen Room Document SPECIMEN-20261103-01.",
    delay: 750,
    event_id: "specimen_turn_10"
  }
];

// Fallback HTML if CouncilEvidencePanel is not loaded
const DECISION_DOC_CONTENT = `
<div class="doc-rendered">
  <div class="doc-warning-banner">
    <strong>⚠️ OFFLINE DEMO SPECIMEN:</strong> This document demonstrates the Track 01 output schema and multi-agent synthesis flow for local inspection. It does NOT constitute a live human authorization or production sign-off.
  </div>
  <h1>COUNCIL DECISION RECORD</h1>
  <p><strong>Document ID:</strong> <span class="citation-pill">SPECIMEN-20261103-01</span></p>
  <p><strong>Switch Room:</strong> <code>switch-council-track01 (Public Preview)</code></p>
  <p><strong>Mattermost Channel:</strong> <code>switch/council</code></p>
  <p><strong>Status:</strong> <span style="color:#FBBF24;font-weight:600;">SIMULATED DEMO ARTIFACT</span></p>
</div>
`;

// DOM Elements
const appContainer = document.getElementById("appContainer");
const seatsRing = document.getElementById("seatsRing");
const messagesContainer = document.getElementById("messagesContainer");
const playWorkflowBtn = document.getElementById("playWorkflowBtn");
const stepWorkflowBtn = document.getElementById("stepWorkflowBtn");
const resetWorkflowBtn = document.getElementById("resetWorkflowBtn");
const docDrawer = document.getElementById("docDrawer");
const docToggleBtn = document.getElementById("docToggleBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const drawerBody = document.getElementById("drawerBody");
const nexusStatus = document.getElementById("nexusStatus");
const viewToggleBtn = document.getElementById("viewToggleBtn");
const holoCanvas = document.getElementById("holoCanvas");
const seatCounter = document.getElementById("seatCounter");

// Mode & Operator DOM Elements
const topModePill = document.getElementById("topModePill");
const truthfulnessBanner = document.getElementById("truthfulnessBanner");
const truthBadge = document.getElementById("truthBadge");
const truthText = document.getElementById("truthText");
const transportSimBar = document.getElementById("transportSimBar");
const transportRetryBtn = document.getElementById("transportRetryBtn");
const transportAlertBox = document.getElementById("transportAlertBox");
const transportAlertTitle = document.getElementById("transportAlertTitle");
const transportAlertDesc = document.getElementById("transportAlertDesc");
const alertRetryBtn = document.getElementById("alertRetryBtn");
const diagCore = document.getElementById("diagCore");
const diagTransport = document.getElementById("diagTransport");
const feedHeaderTitle = document.getElementById("feedHeaderTitle");
const feedSubtitle = document.getElementById("feedSubtitle");
const seatFilterPills = document.getElementById("seatFilterPills");
const streamSearchInput = document.getElementById("streamSearchInput");

const operatorModeBtn = document.getElementById("operatorModeBtn");
const operatorDirectorBar = document.getElementById("operatorDirectorBar");
const directorTurnStatus = document.getElementById("directorTurnStatus");
const opResetBtn = document.getElementById("opResetBtn");
const opPrevTurnBtn = document.getElementById("opPrevTurnBtn");
const opNextTurnBtn = document.getElementById("opNextTurnBtn");
const opPlayPauseBtn = document.getElementById("opPlayPauseBtn");
const opSpotlightBtn = document.getElementById("opSpotlightBtn");
const opEvidenceBtn = document.getElementById("opEvidenceBtn");
const speakerSpotlightCard = document.getElementById("speakerSpotlightCard");
const spotlightAvatar = document.getElementById("spotlightAvatar");
const spotlightName = document.getElementById("spotlightName");
const spotlightRole = document.getElementById("spotlightRole");
const spotlightReceipt = document.getElementById("spotlightReceipt");
const spotlightText = document.getElementById("spotlightText");

// Profile Modal DOM Elements
const profileModalOverlay = document.getElementById("profileModalOverlay");
const profileCard = document.getElementById("profileCard");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const profileStatusIndicator = document.getElementById("profileStatusIndicator");
const profileEmoji = document.getElementById("profileEmoji");
const profileName = document.getElementById("profileName");
const profileRuntime = document.getElementById("profileRuntime");
const profileRole = document.getElementById("profileRole");
const profileExecMode = document.getElementById("profileExecMode");
const profileDesc = document.getElementById("profileDesc");
const profileHonestNote = document.getElementById("profileHonestNote");
const profilePersonaId = document.getElementById("profilePersonaId");
const profileTransport = document.getElementById("profileTransport");
const profilePresence = document.getElementById("profilePresence");
const profileHash = document.getElementById("profileHash");
const profileInspectEvidenceBtn = document.getElementById("profileInspectEvidenceBtn");
const profileFilterStreamBtn = document.getElementById("profileFilterStreamBtn");

let is3DMode = true;
let isRunningWorkflow = false;
let isOperatorMode = false;
let isSpotlightEnabled = true;
let currentMode = "VERIFIED_RECEIPTS";
let currentSeatFilter = "all";
let currentSearchQuery = "";
let activeSpeakerId = "gem";
let stepCursor = 0;
let inspectedSeat = null;

// Initialize Adapter & Evidence Panel helper functions
const eventAdapter = (typeof window !== "undefined" && window.CouncilEventAdapter)
  ? new window.CouncilEventAdapter({ mode: "VERIFIED_RECEIPTS", seats: SEATS })
  : null;

function renderEvidenceDrawer(mode) {
  if (!drawerBody) return;
  if (typeof window !== "undefined" && typeof window.buildCouncilEvidenceModel === "function" && typeof window.renderCouncilEvidencePanelDOM === "function") {
    const events = eventAdapter ? eventAdapter.getEvents() : [];
    const model = window.buildCouncilEvidenceModel(mode, events);
    window.renderCouncilEvidencePanelDOM(drawerBody, model, {
      onSelectSourceEvent: (eventId) => {
        highlightMessageByReceiptOrSender(eventId, null);
      }
    });
  } else {
    drawerBody.innerHTML = DECISION_DOC_CONTENT;
  }
}

function highlightAssessmentCardBySeat(seatId) {
  if (!drawerBody || !seatId) return;
  const cards = drawerBody.querySelectorAll(".assessment-card");
  cards.forEach((c) => {
    if (c.dataset.seatId === seatId) {
      c.classList.add("expanded", "highlighted-assessment");
      if (typeof c.scrollIntoView === "function") {
        c.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      }
    } else {
      c.classList.remove("highlighted-assessment");
    }
  });
}

// Chamber Geometry Helper (Responsive Ring Metrics across 1440x900, 1280x800, 768x1024, 390x844, 360x800)
function getChamberMetrics() {
  const vw = window.innerWidth || 1440;
  const isMobile = vw <= 600;
  const fallbackSize = isMobile ? 284 : (vw <= 960 ? 380 : 410);
  const ringW = (seatsRing && seatsRing.clientWidth >= 240) ? seatsRing.clientWidth : fallbackSize;
  const ringH = (seatsRing && seatsRing.clientHeight >= 240) ? seatsRing.clientHeight : ringW;
  const size = Math.min(ringW, ringH);
  const pad = isMobile ? 26 : 34;
  return {
    radius: Math.round((size / 2) - pad),
    centerX: Math.round(ringW / 2),
    centerY: Math.round(ringH / 2),
    isMobile: isMobile
  };
}

// 1. Initialize 2D Seating Layout (All 9 Council & Squad Seats)
function initSeats() {
  if (!seatsRing) return;
  seatsRing.innerHTML = "";
  const total = SEATS.length;
  const { radius, centerX, centerY, isMobile } = getChamberMetrics();

  let onlineCount = 0;
  const adapterStatuses = (eventAdapter && typeof eventAdapter.getSnapshot === "function")
    ? (eventAdapter.getSnapshot().seatStatuses || {})
    : {};

  SEATS.forEach((seat, idx) => {
    const effectiveStatus = adapterStatuses[seat.id] || seat.honestStatus || "unknown";
    seat.honestStatus = effectiveStatus;
    if (effectiveStatus === "listening" || effectiveStatus === "responding" || effectiveStatus === "receiving" || effectiveStatus === "busy") {
      onlineCount++;
    }
    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    seat._ringAngle = angle;

    const node = document.createElement("div");
    node.className = isMobile ? "seat-node seat-node-mobile" : "seat-node";
    if (seat.id === activeSpeakerId) {
      node.classList.add("active-turn");
    }
    node.id = `seat-${seat.id}`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute(
      "aria-label",
      `${seat.originalName} (${seat.role}) - Status: ${effectiveStatus} (${seat.executionMode})`
    );

    const avatarSrc = seat.photo || seat.avatar;
    const fallbackSvg = seat.avatar;

    node.innerHTML = `
      <div class="seat-avatar status-border-${effectiveStatus}">
        <img src="${avatarSrc}" onerror="this.onerror=null; this.src='${fallbackSvg}';" alt="${seat.originalName}" width="64" height="64" decoding="sync">
      </div>
      <span class="seat-status-dot dot-${effectiveStatus}" title="Current Live Status: ${effectiveStatus.toUpperCase()} (${seat.executionMode})"></span>
      <div class="seat-badge">${seat.emoji} ${seat.originalName}</div>
    `;

    // Click opens profile inspector
    node.addEventListener("click", () => {
      openProfileModal(seat);
      filterMessagesBySender(seat.id);
    });

    // Keyboard support (Enter / Space)
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProfileModal(seat);
        filterMessagesBySender(seat.id);
      }
    });

    seatsRing.appendChild(node);
  });

  if (seatCounter) {
    if (onlineCount > 0 && currentMode === "LIVE_READONLY") {
      seatCounter.textContent = `${total} Configured · ${onlineCount} Live Connected · 8 Historical Own-Seat Proofs`;
    } else {
      seatCounter.textContent = `${total} Configured · 8 Historical Own-Seat Proofs · Current Online: UNKNOWN`;
    }
  }

  initFilterPills();
}

function initFilterPills() {
  if (!seatFilterPills) return;
  seatFilterPills.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.type = "button";
  allBtn.className = currentSeatFilter === "all" ? "filter-pill active" : "filter-pill";
  allBtn.dataset.filterSeat = "all";
  allBtn.textContent = "All Seats (9)";
  allBtn.addEventListener("click", () => applyStreamFilter("all", currentSearchQuery));
  seatFilterPills.appendChild(allBtn);

  SEATS.forEach((seat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = currentSeatFilter === seat.id ? "filter-pill active" : "filter-pill";
    btn.dataset.filterSeat = seat.id;
    btn.textContent = `${seat.emoji} ${seat.originalName}`;
    btn.addEventListener("click", () => applyStreamFilter(seat.id, currentSearchQuery));
    seatFilterPills.appendChild(btn);
  });
}

function applyStreamFilter(seatId, searchQuery) {
  currentSeatFilter = seatId || "all";
  currentSearchQuery = (searchQuery || "").trim().toLowerCase();

  if (seatFilterPills) {
    seatFilterPills.querySelectorAll(".filter-pill").forEach((b) => {
      b.classList.toggle("active", b.dataset.filterSeat === currentSeatFilter);
    });
  }

  const cards = document.querySelectorAll(".message-card");
  cards.forEach((card) => {
    const matchesSeat = currentSeatFilter === "all" || card.dataset.sender === currentSeatFilter;
    const text = (card.textContent || "").toLowerCase();
    const receipt = (card.dataset.eventId || "").toLowerCase();
    const matchesQuery = !currentSearchQuery || text.includes(currentSearchQuery) || receipt.includes(currentSearchQuery);
    card.style.display = (matchesSeat && matchesQuery) ? "flex" : "none";
  });
}

if (streamSearchInput) {
  streamSearchInput.addEventListener("input", (e) => {
    applyStreamFilter(currentSeatFilter, e.target.value);
  });
}

// Profile Modal Controller with Complete Focus Management & Trap
let lastActiveElement = null;

function handleModalFocusTrap(e) {
  if (!profileModalOverlay || !profileModalOverlay.classList.contains("open")) return;
  if (e.key !== "Tab") return;

  const focusable = profileCard.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

function openProfileModal(seat) {
  if (!profileModalOverlay) return;
  inspectedSeat = seat;
  lastActiveElement = document.activeElement;

  const avatarSrc = seat.photo || seat.avatar;
  const fallbackSvg = seat.avatar;

  profileAvatarImg.src = avatarSrc;
  profileAvatarImg.onerror = () => {
    profileAvatarImg.src = fallbackSvg;
  };
  profileAvatarImg.alt = `${seat.originalName} Avatar`;

  profileEmoji.textContent = seat.emoji;
  profileName.textContent = seat.originalName;
  profileRuntime.textContent = seat.runtimeName;
  profileRole.textContent = seat.role;
  if (profileExecMode) {
    profileExecMode.textContent = `Execution Mode: ${seat.executionMode} · Honest Status: ${seat.honestStatus.toUpperCase()}`;
  }
  profileDesc.textContent = seat.description;
  if (profileHonestNote) {
    profileHonestNote.textContent = seat.honestNote || "";
  }
  profilePersonaId.textContent = seat.id;
  profileTransport.textContent = seat.transportId;
  profilePresence.textContent = `${seat.honestStatus.toUpperCase()} (${seat.executionMode})`;
  profileHash.textContent = seat.lastReceiptId || seat.hash;

  profileStatusIndicator.className = "profile-status-indicator";
  if (seat.honestStatus === "responding" || seat.status === "online") {
    profileStatusIndicator.classList.add("online");
  } else if (seat.honestStatus === "listening" || seat.status === "idle") {
    profileStatusIndicator.classList.add("no-session");
  } else {
    profileStatusIndicator.classList.add("offline");
  }

  profileModalOverlay.classList.add("open");
  profileModalOverlay.setAttribute("aria-hidden", "false");
  window.addEventListener("keydown", handleModalFocusTrap);

  // Set focus into modal after transition
  setTimeout(() => {
    if (closeProfileBtn) closeProfileBtn.focus();
  }, 30);
}

function closeProfileModal() {
  if (!profileModalOverlay) return;
  profileModalOverlay.classList.remove("open");
  profileModalOverlay.setAttribute("aria-hidden", "true");
  window.removeEventListener("keydown", handleModalFocusTrap);

  // Restore focus to opener element
  if (lastActiveElement && typeof lastActiveElement.focus === "function") {
    lastActiveElement.focus();
    lastActiveElement = null;
  }
}

if (closeProfileBtn) {
  closeProfileBtn.addEventListener("click", closeProfileModal);
}

if (profileInspectEvidenceBtn) {
  profileInspectEvidenceBtn.addEventListener("click", () => {
    const targetSeat = inspectedSeat;
    closeProfileModal();
    if (docDrawer) {
      docDrawer.classList.add("open");
      docToggleBtn.classList.add("active-view");
      if (targetSeat) {
        highlightAssessmentCardBySeat(targetSeat.id);
      }
    }
  });
}

if (profileFilterStreamBtn) {
  profileFilterStreamBtn.addEventListener("click", () => {
    const targetSeat = inspectedSeat;
    closeProfileModal();
    if (targetSeat) {
      applyStreamFilter(targetSeat.id, currentSearchQuery);
    }
  });
}

if (profileModalOverlay) {
  profileModalOverlay.addEventListener("click", (e) => {
    if (e.target === profileModalOverlay) {
      closeProfileModal();
    }
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && profileModalOverlay && profileModalOverlay.classList.contains("open")) {
    closeProfileModal();
  }
  if (e.altKey && (e.key === "o" || e.key === "O")) {
    e.preventDefault();
    toggleOperatorMode();
  }
});

// 2. Holographic Canvas (Procedural 3D Particle Nexus + Active Speaker Beam with Reduced Motion Guard)
let ctx = holoCanvas.getContext("2d");
let animationFrameId = null;
let particles = [];
let angleOffset = 0;

const motionQuery = (typeof window !== "undefined" && window.matchMedia)
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : null;
let prefersReducedMotion = motionQuery ? motionQuery.matches : false;

if (motionQuery && motionQuery.addEventListener) {
  motionQuery.addEventListener("change", (e) => {
    prefersReducedMotion = e.matches;
    if (prefersReducedMotion) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      renderHoloFrame();
    } else if (is3DMode && !animationFrameId) {
      animateHolo();
    }
  });
}

function initHoloCanvas() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  particles = [];
  for (let i = 0; i < 90; i++) {
    particles.push({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(Math.random() * 2 - 1),
      radius: 90 + Math.random() * 50,
      size: 1 + Math.random() * 2,
      speed: 0.003 + Math.random() * 0.004
    });
  }

  if (prefersReducedMotion) {
    renderHoloFrame();
  } else {
    animateHolo();
  }
}

function resizeCanvas() {
  const rect = holoCanvas.getBoundingClientRect();
  holoCanvas.width = rect.width || 600;
  holoCanvas.height = rect.height || 450;
  if (prefersReducedMotion) {
    renderHoloFrame();
  }
}

function renderHoloFrame() {
  ctx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);

  if (is3DMode) {
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;

    // Active speaker energy vector beam from seat to Central Nexus
    if (activeSpeakerId) {
      const seatIdx = SEATS.findIndex(s => s.id === activeSpeakerId);
      if (seatIdx >= 0) {
        const angle = (seatIdx / SEATS.length) * 2 * Math.PI - Math.PI / 2;
        const { radius } = getChamberMetrics();
        const tx = cx + radius * Math.cos(angle);
        const ty = cy + radius * Math.sin(angle);

        ctx.strokeStyle = "rgba(0, 240, 255, 0.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
    particles.forEach(p => {
      if (!prefersReducedMotion) {
        p.theta += p.speed;
      }
      const x = cx + p.radius * Math.sin(p.phi) * Math.cos(p.theta + angleOffset);
      const y = cy + (p.radius * Math.cos(p.phi) * 0.4) + Math.sin(angleOffset) * 10;
      const alpha = 0.2 + (Math.sin(p.theta) + 1) * 0.3;

      ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Outer grid rings
    ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 180, 70, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 240, 90, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function animateHolo() {
  renderHoloFrame();
  if (prefersReducedMotion || !is3DMode) {
    animationFrameId = null;
    return;
  }
  angleOffset += 0.005;
  animationFrameId = requestAnimationFrame(animateHolo);
}

// 3. Operating Mode Controller (VERIFIED_RECEIPTS / DEMO_SPECIMEN / LIVE_READONLY)
function setOperatingMode(mode) {
  if (workflowAbortController) {
    workflowAbortController.abort();
    workflowAbortController = null;
  }
  isRunningWorkflow = false;
  if (playWorkflowBtn) playWorkflowBtn.disabled = false;

  currentMode = mode;
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  if (eventAdapter) {
    eventAdapter.setMode(mode, SEATS);
  }
  initSeats();
  renderEvidenceDrawer(mode);

  if (transportAlertBox) transportAlertBox.hidden = true;
  if (transportSimBar) transportSimBar.hidden = (mode !== "LIVE_READONLY");

  if (mode === "VERIFIED_RECEIPTS") {
    if (topModePill) {
      topModePill.textContent = "[HISTORICAL PROOF SUMMARY]";
      topModePill.className = "demo-specimen-pill pill-verified";
    }
    if (truthfulnessBanner) truthfulnessBanner.className = "truthfulness-strip mode-verified";
    if (truthBadge) truthBadge.textContent = "[CURATED HISTORICAL PROOF SUMMARY]";
    if (truthText) {
      truthText.textContent = "Displaying 9 curated historical proof summaries from Nov 5–6 seat-steering verification (4 Mode-A · 2 Pattern-B · 2 Direct-MCP · 1 Human). Current live seat status: UNKNOWN. Human decision status: AWAITING_HUMAN_DECISION.";
    }
    if (diagCore) {
      diagCore.textContent = "Curated Historical Proofs (Offline)";
      diagCore.className = "diag-val badge-amber";
    }
    if (diagTransport) {
      diagTransport.textContent = "4 Mode-A · 2 Pattern-B · 2 Direct-MCP";
      diagTransport.className = "diag-val badge-green";
    }
    if (feedHeaderTitle) feedHeaderTitle.textContent = "CURATED HISTORICAL PROOF STREAM";
    if (feedSubtitle) feedSubtitle.textContent = "Nov 5–6 recorded own-seat proofs & canonical workflow question (offline summary)";
    if (nexusStatus) {
      nexusStatus.textContent = "HISTORICAL";
      nexusStatus.style.color = "#10B981";
    }
    renderVerifiedReceiptsStream();
  } else if (mode === "DEMO_SPECIMEN") {
    if (topModePill) {
      topModePill.textContent = "[DEMO SPECIMEN]";
      topModePill.className = "demo-specimen-pill";
    }
    if (truthfulnessBanner) truthfulnessBanner.className = "truthfulness-strip mode-demo";
    if (truthBadge) truthBadge.textContent = "[OFFLINE DEMO SPECIMEN]";
    if (truthText) {
      truthText.textContent = "Simulated Track 01 multi-agent synthesis walkthrough for local demonstration. Does NOT claim live model inference or live human sign-off.";
    }
    if (diagCore) {
      diagCore.textContent = "Local Specimen (Offline)";
      diagCore.className = "diag-val badge-amber";
    }
    if (diagTransport) {
      diagTransport.textContent = "Specimen Fixtures (Ready)";
      diagTransport.className = "diag-val badge-amber";
    }
    if (feedHeaderTitle) feedHeaderTitle.textContent = "WORKFLOW DEMO STREAM";
    if (feedSubtitle) feedSubtitle.textContent = "Track 01 Offline Schema Demonstration";
    if (nexusStatus) {
      nexusStatus.textContent = "SPECIMEN";
      nexusStatus.style.color = "#F59E0B";
    }
    renderDemoStreamInitial();
  } else if (mode === "LIVE_READONLY") {
    // P0.3 Truthfulness Rule: LIVE_READONLY defaults to LIVE NOT CONNECTED / LIVE PREVIEW UNAVAILABLE
    // and NEVER renders historical fixtures as if they were live traffic.
    if (topModePill) {
      topModePill.textContent = "[LIVE NOT CONNECTED]";
      topModePill.className = "demo-specimen-pill";
    }
    if (truthfulnessBanner) truthfulnessBanner.className = "truthfulness-strip mode-live";
    if (truthBadge) truthBadge.textContent = "[LIVE PREVIEW UNAVAILABLE — NOT CONNECTED]";
    if (truthText) {
      truthText.textContent = "LIVE NOT CONNECTED: No authenticated read-only Switch/Mattermost proxy is active. Historical fixtures are withheld in Live mode so offline records are never mistaken for live traffic.";
    }
    if (diagCore) {
      diagCore.textContent = "Live Read-Only (Not Connected)";
      diagCore.className = "diag-val badge-amber";
    }
    if (diagTransport) {
      diagTransport.textContent = "LIVE NOT CONNECTED (No Proxy)";
      diagTransport.className = "diag-val badge-amber";
    }
    if (feedHeaderTitle) feedHeaderTitle.textContent = "LIVE READ-ONLY CHANNEL STREAM";
    if (feedSubtitle) feedSubtitle.textContent = "Requires authenticated read-only host proxy (/api/council/live-history)";
    if (nexusStatus) {
      nexusStatus.textContent = "NOT CONNECTED";
      nexusStatus.style.color = "#EF4444";
    }
    document.querySelectorAll(".sim-state-btn[data-sim-state]").forEach((b) => {
      b.classList.toggle("active", b.dataset.simState === "disconnected");
    });
    if (transportAlertBox) {
      transportAlertBox.hidden = false;
      transportAlertTitle.textContent = "🔌 LIVE NOT CONNECTED / LIVE PREVIEW UNAVAILABLE";
      transportAlertDesc.textContent = "No authenticated read-only proxy connection is active. Start scripts/serve_council_live.py for live Mattermost/Core history or use the SIMULATE buttons above to inspect fault handling.";
    }
    renderLiveDisconnectedStream();
    probeLiveProxyEndpoint();
  }
}

function renderLiveDisconnectedStream() {
  if (!messagesContainer) return;
  messagesContainer.innerHTML = "";
  const emptyBox = document.createElement("div");
  emptyBox.className = "live-disconnected-notice";
  emptyBox.style.padding = "24px";
  emptyBox.style.margin = "16px";
  emptyBox.style.borderRadius = "10px";
  emptyBox.style.border = "1px dashed rgba(245, 158, 11, 0.45)";
  emptyBox.style.background = "rgba(245, 158, 11, 0.06)";
  emptyBox.style.color = "#F3F4F6";
  emptyBox.innerHTML = `
    <strong style="color:#FBBF24;display:block;margin-bottom:6px;">📡 LIVE PREVIEW UNAVAILABLE — NOT CONNECTED TO LIVE PROXY</strong>
    <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">
      Historical proofs and demo specimens are strictly withheld in <code>LIVE_READONLY</code> mode so offline fixtures are never presented as live room traffic.
      Connect the local read-only proxy (<code>python scripts/serve_council_live.py</code>) and click <strong>↻ Probe Live Proxy</strong> to ingest genuine live posts.
    </p>
  `;
  messagesContainer.appendChild(emptyBox);
}

async function probeLiveProxyEndpoint() {
  if (typeof fetch !== "function" || currentMode !== "LIVE_READONLY") return false;
  try {
    // Same-origin, no-store read. A static Vercel preview has no authenticated Core proxy.
    const resp = await fetch("/api/council/live-history", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    if (!data || data.ok !== true || data.verified_by_host_proxy !== true || !Array.isArray(data.events)) return false;
    if (currentMode !== "LIVE_READONLY" || !eventAdapter) return false;

    eventAdapter.clearEvents();
    data.events.forEach((ev) => {
      if (!ev || typeof ev.event_id !== "string" || !/^sw_[0-9a-fA-F]{32}$/.test(ev.event_id)) return;
      // The browser must never infer Jay's authenticated principal from a display label.
      // A human decision needs separately validated server-side identity/correlation proof.
      eventAdapter.ingestEvent(ev, {
        verified_by_host_proxy: true,
        authenticated_principal: "",
        source_msg_id: ev.event_id,
        proposal_correlation_id: null
      });
    });
    const trustedEvents = eventAdapter.getEvents();
    // Transport connectivity does NOT establish that any of the 9 agent models is online.
    eventAdapter.simulateTransportState("connected", null, SEATS);

    initSeats();
    renderEvidenceDrawer("LIVE_READONLY");
    if (topModePill) topModePill.textContent = "[LIVE HISTORY PROXY CONNECTED]";
    if (truthBadge) truthBadge.textContent = "[AUTHENTICATED READ-ONLY CORE HISTORY]";
    if (truthText) truthText.textContent =
      `Read-only host proxy returned ${trustedEvents.length} Core event receipts. Agent presence: UNKNOWN. Human decision: requires separate verified authorization.`;
    if (diagCore) {
      diagCore.textContent = "Read-Only Core History (Connected)";
      diagCore.className = "diag-val badge-green";
    }
    if (diagTransport) {
      diagTransport.textContent = `Core history: ${trustedEvents.length} verified IDs; agent presence UNKNOWN`;
      diagTransport.className = "diag-val badge-green";
    }
    if (nexusStatus) {
      nexusStatus.textContent = "HISTORY CONNECTED";
      nexusStatus.style.color = "#10B981";
    }
    if (transportAlertBox) transportAlertBox.hidden = true;
    if (messagesContainer) {
      messagesContainer.innerHTML = "";
      trustedEvents.forEach((ev) => appendMessageCard({
        sender: ev.sender_id,
        prefix: ev.prefix,
        content: ev.content,
        event_id: ev.event_id,
        timestamp: ev.timestamp,
        execution_mode: ev.execution_mode,
        source_verified_link: ev.source_verified_link === true,
        provenance: ev.provenance
      }));
    }
    return true;
  } catch (_) {
    // Expected when serving static UI without the authenticated local read-only proxy.
    return false;
  }
}

function getVerifiedTurnsList() {
  const rawEvents = (window.CouncilEventAdapterModule && window.CouncilEventAdapterModule.VERIFIED_RECEIPT_EVENTS)
    ? window.CouncilEventAdapterModule.VERIFIED_RECEIPT_EVENTS
    : (eventAdapter ? eventAdapter.getEvents() : []);
  if (!rawEvents || rawEvents.length === 0) return WORKFLOW_SCRIPT;
  return rawEvents.map((ev) => {
    const senderId = ev.sender_id || ev.seat_id || ev.sender || "gem";
    const seat = SEATS.find(s => s.id === senderId) || SEATS[0];
    return {
      sender: senderId,
      prefix: ev.prefix || `${seat.originalName} (${seat.runtimeName}):`,
      content: ev.content,
      event_id: ev.event_id,
      timestamp: ev.timestamp,
      execution_mode: ev.execution_mode || seat.executionMode,
      source_verified_link: Boolean(ev.source_verified_link),
      provenance: ev.provenance || "CURATED_HISTORICAL_SUMMARY"
    };
  });
}

function renderVerifiedReceiptsStream() {
  if (!messagesContainer) return;
  messagesContainer.innerHTML = "";
  const turns = getVerifiedTurnsList();
  turns.forEach((t) => appendMessageCard(t));
  stepCursor = turns.length;
  updateSpotlightFromTurn(turns[turns.length - 1]);
  updateDirectorStatus(stepCursor, turns.length);
}

function renderDemoStreamInitial() {
  if (!messagesContainer) return;
  messagesContainer.innerHTML = "";
  WORKFLOW_SCRIPT.forEach((turn) => {
    appendMessageCard(Object.assign({}, turn, { provenance: "DEMO_FIXTURE", source_verified_link: false }));
  });
  stepCursor = WORKFLOW_SCRIPT.length;
  updateSpotlightFromTurn(WORKFLOW_SCRIPT[WORKFLOW_SCRIPT.length - 1]);
  updateDirectorStatus(stepCursor, WORKFLOW_SCRIPT.length);
}

// 4. Workflow Simulation Engine with AbortController Cancellation & Safe DOM Rendering
let workflowAbortController = null;

async function runWorkflow() {
  if (isRunningWorkflow) return;
  if (currentMode !== "DEMO_SPECIMEN") {
    setOperatingMode("DEMO_SPECIMEN");
  }
  isRunningWorkflow = true;
  workflowAbortController = new AbortController();
  const { signal } = workflowAbortController;

  playWorkflowBtn.disabled = true;
  messagesContainer.innerHTML = "";
  nexusStatus.textContent = "IN SESSION";
  nexusStatus.style.color = "#00F0FF";

  for (let i = 0; i < WORKFLOW_SCRIPT.length; i++) {
    if (signal.aborted) return;
    const turn = WORKFLOW_SCRIPT[i];
    stepCursor = i + 1;

    highlightSeat(turn.sender);
    updateSpotlightFromTurn(turn);
    updateDirectorStatus(stepCursor, WORKFLOW_SCRIPT.length);

    // Cancellable timeout promise
    const completed = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(true), turn.delay);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        resolve(false);
      }, { once: true });
    });

    if (!completed || signal.aborted) {
      return;
    }

    appendMessageCard(turn);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  if (signal.aborted) return;

  clearSeatHighlights();
  nexusStatus.textContent = "DECIDED";
  nexusStatus.style.color = "#10B981";

  renderEvidenceDrawer("DEMO_SPECIMEN");
  docDrawer.classList.add("open");
  docToggleBtn.classList.add("active-view");

  isRunningWorkflow = false;
  playWorkflowBtn.disabled = false;
  workflowAbortController = null;
}

function stepWorkflow(direction = 1) {
  if (workflowAbortController) {
    workflowAbortController.abort();
    workflowAbortController = null;
    isRunningWorkflow = false;
    if (playWorkflowBtn) playWorkflowBtn.disabled = false;
  }

  const sourceList = (currentMode === "VERIFIED_RECEIPTS" || currentMode === "LIVE_READONLY")
    ? getVerifiedTurnsList()
    : WORKFLOW_SCRIPT;

  if (stepCursor >= sourceList.length && direction > 0) {
    stepCursor = 1;
  } else {
    stepCursor = Math.max(1, Math.min(sourceList.length, stepCursor + direction));
  }

  messagesContainer.innerHTML = "";
  for (let i = 0; i < stepCursor; i++) {
    appendMessageCard(sourceList[i]);
  }
  const activeTurn = sourceList[stepCursor - 1];
  if (activeTurn) {
    highlightSeat(activeTurn.sender);
    updateSpotlightFromTurn(activeTurn);
  }
  updateDirectorStatus(stepCursor, sourceList.length);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessageCard(turn) {
  const seat = SEATS.find(s => s.id === turn.sender) || {
    id: "unknown",
    originalName: "Agent",
    runtimeName: "Agent-Switch",
    role: "Council",
    emoji: "⚡",
    avatar: "avatars/buddy.svg",
    photo: "avatars/buddy.png",
    status: "online",
    honestStatus: "unknown",
    executionMode: "automated",
    lastReceiptId: "unverified"
  };

  const card = document.createElement("div");
  card.className = "message-card";
  card.dataset.sender = turn.sender;
  const receiptId = turn.event_id || seat.lastReceiptId || "specimen";
  card.dataset.eventId = receiptId;

  const now = new Date();
  const timeStr = turn.timestamp
    ? new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const avatarSrc = seat.photo || seat.avatar;
  const fallbackSvg = seat.avatar;

  // Safe DOM construction (prevents injection / XSS)
  const avatarCol = document.createElement("div");
  avatarCol.className = "msg-avatar-col";
  avatarCol.style.cursor = "pointer";
  avatarCol.title = `Inspect ${seat.originalName}'s profile`;

  const avatarImg = document.createElement("img");
  avatarImg.src = avatarSrc;
  avatarImg.onerror = () => {
    avatarImg.onerror = null;
    avatarImg.src = fallbackSvg;
  };
  avatarImg.alt = `${seat.originalName} (${seat.runtimeName})`;
  avatarImg.width = 42;
  avatarImg.height = 42;
  avatarImg.loading = "lazy";
  avatarCol.appendChild(avatarImg);

  const bodyCol = document.createElement("div");
  bodyCol.className = "msg-body-col";

  const metaDiv = document.createElement("div");
  metaDiv.className = "msg-meta";

  const authorSpan = document.createElement("span");
  authorSpan.className = "msg-author";
  authorSpan.textContent = turn.prefix || "";

  const roleTag = document.createElement("span");
  roleTag.className = "msg-role-tag";
  roleTag.textContent = seat.role || "";

  const execTag = document.createElement("span");
  execTag.className = "msg-exec-tag";
  execTag.textContent = turn.execution_mode || seat.executionMode || "automated";

  const timeSpan = document.createElement("span");
  timeSpan.className = "msg-time";
  timeSpan.textContent = timeStr;

  metaDiv.appendChild(authorSpan);
  metaDiv.appendChild(roleTag);
  metaDiv.appendChild(execTag);
  metaDiv.appendChild(timeSpan);

  const contentDiv = document.createElement("div");
  contentDiv.className = "msg-content";
  contentDiv.textContent = turn.content || "";
  if (typeof window.renderSafeMessageContent === "function") {
    window.renderSafeMessageContent(contentDiv, turn.content || "");
  }

  // Source-linked receipt / historical summary footer bar (P0.1 Truthful Provenance)
  const footerDiv = document.createElement("div");
  footerDiv.className = "msg-receipt-footer";

  const isLiveVerifiedLink = Boolean(turn.source_verified_link === true && turn.provenance === "LIVE_EVENT");
  const receiptBadge = document.createElement("button");
  receiptBadge.type = "button";
  receiptBadge.className = isLiveVerifiedLink ? "msg-receipt-pill" : "msg-receipt-pill badge-historical-summary";
  if (isLiveVerifiedLink) {
    receiptBadge.textContent = `🔗 Verified Live Receipt: ${receiptId}`;
    receiptBadge.title = "Verified live room event receipt";
  } else if (turn.provenance === "DEMO_FIXTURE" || String(receiptId).startsWith("specimen_")) {
    receiptBadge.textContent = `🧪 Demo Specimen ID: ${receiptId}`;
    receiptBadge.disabled = true;
    receiptBadge.setAttribute("aria-disabled", "true");
    receiptBadge.title = "Simulated offline demo specimen identifier (not a live room receipt)";
  } else {
    receiptBadge.textContent = `📋 Historical Summary: ${receiptId}`;
    receiptBadge.disabled = true;
    receiptBadge.setAttribute("aria-disabled", "true");
    receiptBadge.title = "Curated historical summary reference (not a clickable live room receipt)";
  }
  footerDiv.appendChild(receiptBadge);

  const inspectRoleBtn = document.createElement("button");
  inspectRoleBtn.type = "button";
  inspectRoleBtn.className = "msg-receipt-pill inspect-role-btn";
  inspectRoleBtn.textContent = "📜 Role Summary";
  inspectRoleBtn.title = "Open Evidence & Decision Panel and inspect this role's readiness summary";
  inspectRoleBtn.addEventListener("click", () => {
    if (docDrawer) {
      docDrawer.classList.add("open");
      docToggleBtn.classList.add("active-view");
      highlightAssessmentCardBySeat(seat.id);
    }
  });
  footerDiv.appendChild(inspectRoleBtn);

  if (turn.verification && turn.verification.latency_ms) {
    const latencySpan = document.createElement("span");
    latencySpan.className = "msg-latency-pill";
    latencySpan.textContent = `✓ ${turn.verification.pattern} (${turn.verification.latency_ms}ms)`;
    footerDiv.appendChild(latencySpan);
  }

  bodyCol.appendChild(metaDiv);
  bodyCol.appendChild(contentDiv);
  bodyCol.appendChild(footerDiv);

  card.appendChild(avatarCol);
  card.appendChild(bodyCol);

  avatarCol.addEventListener("click", () => openProfileModal(seat));
  messagesContainer.appendChild(card);
}

function highlightSeat(senderId) {
  activeSpeakerId = senderId;
  clearSeatHighlights();
  const node = document.getElementById(`seat-${senderId}`);
  if (node) {
    node.classList.add("active-turn");
  }
  if (prefersReducedMotion) {
    renderHoloFrame();
  }
}

function clearSeatHighlights() {
  document.querySelectorAll(".seat-node").forEach(n => n.classList.remove("active-turn"));
}

function highlightMessageByReceiptOrSender(receiptId, senderId) {
  const cards = document.querySelectorAll(".message-card");
  for (const card of cards) {
    if (card.dataset.eventId === receiptId || card.dataset.sender === senderId) {
      card.style.borderColor = "var(--accent-cyan)";
      if (typeof card.scrollIntoView === "function") {
        card.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      }
      setTimeout(() => {
        card.style.borderColor = "var(--border-subtle)";
      }, 2200);
      break;
    }
  }
}

function resetWorkflow() {
  if (workflowAbortController) {
    workflowAbortController.abort();
    workflowAbortController = null;
  }
  isRunningWorkflow = false;
  if (playWorkflowBtn) {
    playWorkflowBtn.disabled = false;
  }

  clearSeatHighlights();
  activeSpeakerId = "gem";
  highlightSeat("gem");

  if (currentMode === "VERIFIED_RECEIPTS" || currentMode === "LIVE_READONLY") {
    renderVerifiedReceiptsStream();
  } else {
    renderDemoStreamInitial();
  }

  renderEvidenceDrawer(currentMode);
}

function filterMessagesBySender(senderId) {
  const cards = document.querySelectorAll(".message-card");
  cards.forEach(card => {
    if (card.dataset.sender === senderId) {
      card.style.borderColor = "var(--accent-cyan)";
      if (typeof card.scrollIntoView === "function") {
        card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
      setTimeout(() => card.style.borderColor = "var(--border-subtle)", 2000);
    }
  });
}

// 5. Boons Operator Presentation Mode & Spotlight Controls
function updateSpotlightFromTurn(turn) {
  if (!speakerSpotlightCard || !turn) return;
  const seat = SEATS.find(s => s.id === (turn.seat_id || turn.sender)) || SEATS[0];
  if (spotlightAvatar) {
    spotlightAvatar.src = seat.photo || seat.avatar;
    spotlightAvatar.onerror = () => { spotlightAvatar.src = seat.avatar; };
  }
  if (spotlightName) spotlightName.textContent = `${seat.emoji} ${seat.originalName}`;
  if (spotlightRole) spotlightRole.textContent = seat.role;
  if (spotlightReceipt) spotlightReceipt.textContent = turn.event_id || seat.lastReceiptId;
  if (spotlightText) spotlightText.textContent = turn.content || "";
  speakerSpotlightCard.hidden = !(isOperatorMode && isSpotlightEnabled);
}

function updateDirectorStatus(step, total) {
  if (!directorTurnStatus) return;
  const seat = SEATS.find(s => s.id === activeSpeakerId) || SEATS[0];
  directorTurnStatus.textContent = `Turn ${step} / ${total} — Active: ${seat.emoji} ${seat.originalName} (${seat.role})`;
}

function toggleOperatorMode() {
  isOperatorMode = !isOperatorMode;
  if (appContainer) {
    appContainer.classList.toggle("operator-presentation-mode", isOperatorMode);
  }
  if (operatorModeBtn) {
    operatorModeBtn.classList.toggle("active-view", isOperatorMode);
  }
  if (operatorDirectorBar) {
    operatorDirectorBar.hidden = !isOperatorMode;
  }
  if (speakerSpotlightCard) {
    speakerSpotlightCard.hidden = !(isOperatorMode && isSpotlightEnabled);
  }
  setTimeout(() => {
    resizeCanvas();
    initSeats();
  }, 50);
}

if (operatorModeBtn) {
  operatorModeBtn.addEventListener("click", toggleOperatorMode);
}
if (opResetBtn) {
  opResetBtn.addEventListener("click", () => {
    stepCursor = 0;
    stepWorkflow(1);
  });
}
if (opPrevTurnBtn) {
  opPrevTurnBtn.addEventListener("click", () => stepWorkflow(-1));
}
if (opNextTurnBtn) {
  opNextTurnBtn.addEventListener("click", () => stepWorkflow(1));
}
if (opPlayPauseBtn) {
  opPlayPauseBtn.addEventListener("click", () => {
    if (isRunningWorkflow) {
      if (workflowAbortController) workflowAbortController.abort();
      isRunningWorkflow = false;
      opPlayPauseBtn.textContent = "▶ Auto-Play";
    } else {
      opPlayPauseBtn.textContent = "⏸ Pause";
      runWorkflow().finally(() => {
        opPlayPauseBtn.textContent = "▶ Auto-Play";
      });
    }
  });
}
if (opSpotlightBtn) {
  opSpotlightBtn.addEventListener("click", () => {
    isSpotlightEnabled = !isSpotlightEnabled;
    opSpotlightBtn.textContent = isSpotlightEnabled ? "🎯 Spotlight: ON" : "🎯 Spotlight: OFF";
    if (speakerSpotlightCard) {
      speakerSpotlightCard.hidden = !(isOperatorMode && isSpotlightEnabled);
    }
  });
}
if (opEvidenceBtn) {
  opEvidenceBtn.addEventListener("click", () => {
    docDrawer.classList.toggle("open");
    docToggleBtn.classList.toggle("active-view");
  });
}

// 6. Mode Switcher & Live Transport Simulator Listeners
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    setOperatingMode(btn.dataset.mode);
  });
});

document.querySelectorAll(".sim-state-btn[data-sim-state]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const state = btn.dataset.simState;
    document.querySelectorAll(".sim-state-btn[data-sim-state]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    applySimulatedTransportState(state);
  });
});

function applySimulatedTransportState(state) {
  if (!eventAdapter) return;
  if (state === "connected") {
    eventAdapter.simulateTransportState("connected", null, SEATS);
    initSeats();
    if (transportAlertBox) {
      transportAlertBox.hidden = false;
      transportAlertTitle.textContent = "🧪 SIMULATED: Connected Transport State";
      transportAlertDesc.textContent = "Fault-injection preview of connected listener state. Seat dots show LISTENING (idle) — listener connectivity does NOT imply active model reasoning.";
    }
    if (diagTransport) {
      diagTransport.textContent = "SIMULATED: Connected Listener";
      diagTransport.className = "diag-val badge-amber";
    }
    if (nexusStatus) {
      nexusStatus.textContent = "SIM-CONN";
      nexusStatus.style.color = "#00F0FF";
    }
  } else if (state === "stale") {
    eventAdapter.simulateTransportState("stale", "Last event heartbeat was 42s ago (threshold: 30s). Showing last verified state.", SEATS);
    initSeats();
    if (transportAlertBox) {
      transportAlertBox.hidden = false;
      transportAlertTitle.textContent = "⚠️ Stale Heartbeat Detected (42s elapsed)";
      transportAlertDesc.textContent = "No event frame received within 30s threshold. Seat indicators moved to STALE; no active model reasoning is assumed.";
    }
    if (diagTransport) {
      diagTransport.textContent = "STALE (42s lag)";
      diagTransport.className = "diag-val badge-amber";
    }
    if (nexusStatus) {
      nexusStatus.textContent = "STALE";
      nexusStatus.style.color = "#F59E0B";
    }
  } else if (state === "denied") {
    eventAdapter.simulateTransportState("denied", "HTTP 401/403: Read-only observer token missing or expired", SEATS);
    initSeats();
    if (transportAlertBox) {
      transportAlertBox.hidden = false;
      transportAlertTitle.textContent = "🔒 HTTP 401/403 Permission Denied";
      transportAlertDesc.textContent = "Live endpoint rejected unauthenticated browser request. Agent credentials remain strictly outside the browser bundle.";
    }
    if (diagTransport) {
      diagTransport.textContent = "401 DENIED (Fail-Closed)";
      diagTransport.className = "diag-val badge-amber";
    }
    if (nexusStatus) {
      nexusStatus.textContent = "DENIED";
      nexusStatus.style.color = "#EF4444";
    }
  } else if (state === "disconnected") {
    eventAdapter.simulateTransportState("disconnected", "Mattermost WebSocket / Switch SSE stream closed", SEATS);
    initSeats();
    if (transportAlertBox) {
      transportAlertBox.hidden = false;
      transportAlertTitle.textContent = "🔌 Transport Disconnected (Backoff Retry Ready)";
      transportAlertDesc.textContent = "Live event stream closed. Click Reconnect to perform idempotent event_id catch-up without duplicate turns.";
    }
    if (diagTransport) {
      diagTransport.textContent = "DISCONNECTED";
      diagTransport.className = "diag-val badge-amber";
    }
    if (nexusStatus) {
      nexusStatus.textContent = "OFFLINE";
      nexusStatus.style.color = "#EF4444";
    }
  }
}

if (transportRetryBtn) {
  transportRetryBtn.addEventListener("click", () => probeLiveProxyEndpoint());
}
if (alertRetryBtn) {
  alertRetryBtn.addEventListener("click", () => probeLiveProxyEndpoint());
}

// 7. View Toggles & Event Listeners
viewToggleBtn.addEventListener("click", () => {
  is3DMode = !is3DMode;
  if (is3DMode) {
    viewToggleBtn.classList.add("active-view");
    document.getElementById("viewModeLabel").textContent = "Chamber: 3D Holo";
    holoCanvas.style.opacity = "1";
    if (!prefersReducedMotion && !animationFrameId) animateHolo();
  } else {
    viewToggleBtn.classList.remove("active-view");
    document.getElementById("viewModeLabel").textContent = "Chamber: 2D Ring";
    holoCanvas.style.opacity = "0.2";
  }
});

docToggleBtn.addEventListener("click", () => {
  docDrawer.classList.toggle("open");
  docToggleBtn.classList.toggle("active-view");
});

closeDrawerBtn.addEventListener("click", () => {
  docDrawer.classList.remove("open");
  docToggleBtn.classList.remove("active-view");
});

playWorkflowBtn.addEventListener("click", runWorkflow);
if (stepWorkflowBtn) {
  stepWorkflowBtn.addEventListener("click", () => stepWorkflow(1));
}
resetWorkflowBtn.addEventListener("click", resetWorkflow);

// 8. Live Switch Core Read-Only Bridge (Section 4: Verified Host Proxy Boundary)
// Verified against deployed Switch Core (:8000): direct unauthenticated browser SSE to
// `/rooms/{id}/events` is invalid (HTTP 404) and Core `/agents/{id}/rooms/{room}/history`
// requires a privileged agent Bearer token that must NEVER be bundled in browser code.
// Therefore, SwitchCoreBridge connects strictly through the read-only host proxy endpoint
// (`/api/council/live-history` served by `scripts/serve_council_live.py`) and fails closed
// to `LIVE NOT CONNECTED` whenever the proxy is unavailable or unverified.
class SwitchCoreBridge {
  constructor(proxyEndpoint = "/api/council/live-history") {
    this.proxyEndpoint = proxyEndpoint;
    this.pollTimer = null;
  }

  async connectReadOnly() {
    const ok = await probeLiveProxyEndpoint();
    if (!ok && currentMode === "LIVE_READONLY") {
      if (eventAdapter) {
        eventAdapter.simulateTransportState(
          "disconnected",
          "LIVE NOT CONNECTED: Authenticated read-only host proxy (/api/council/live-history) is not active.",
          SEATS
        );
      }
      initSeats();
    }
    return ok;
  }

  disconnect() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

window.SwitchCoreBridge = SwitchCoreBridge;
window.SEATS = SEATS;
window.WORKFLOW_SCRIPT = WORKFLOW_SCRIPT;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.runWorkflow = runWorkflow;
window.stepWorkflow = stepWorkflow;
window.resetWorkflow = resetWorkflow;
window.appendMessageCard = appendMessageCard;
window.setOperatingMode = setOperatingMode;
window.toggleOperatorMode = toggleOperatorMode;

// Initial Boot
initSeats();
initHoloCanvas();
setOperatingMode("VERIFIED_RECEIPTS");

// Responsive Dynamic Re-render on Viewport Resize
window.addEventListener("resize", () => {
  initSeats();
});
