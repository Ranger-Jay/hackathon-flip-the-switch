// Council Room — Accessible Chamber Interface & Avatar Presentation
// Clean public implementation for Switch Hackathon (Track 01)
const SWITCH_ROOM_ID = "4fac4eab-759d-4fc7-9800-04f6bfa631db";
const MATTERMOST_CHANNEL_ID = "44dwjxtfbfgf7c1siwopmxoacr";

const SEATS = [
  {
    id: "jay",
    originalName: "Jay",
    runtimeName: "Jay",
    role: "Human Lead & Authorizer",
    emoji: "🐕",
    avatar: "avatars/jay.svg",
    photo: null,
    status: "online",
    transportId: "user",
    description: "Company founder, product visionary, and ultimate authorization authority for all architecture decisions.",
    hash: "0xJAY777A1"
  },
  {
    id: "buddy",
    originalName: "Buddy",
    runtimeName: "Buddy-Switch",
    role: "Architect & Conductor",
    emoji: "🦅",
    avatar: "avatars/buddy.svg",
    photo: null,
    status: "online",
    transportId: "buddy",
    description: "Chief problem-solver, orchestrator, and synthesizer across all squad roles and evidence matrices.",
    hash: "0xBUD999F2"
  },
  {
    id: "cora",
    originalName: "Cora",
    runtimeName: "Cora-Switch",
    role: "Operations Lead & Commander",
    emoji: "🎖️",
    avatar: "avatars/cora.svg",
    photo: null,
    status: "online",
    transportId: "cora",
    description: "Company Commander, operations lead, host infrastructure runtime, and security gating.",
    hash: "0xCOR444C3"
  },
  {
    id: "gem",
    originalName: "Gem",
    runtimeName: "Gem-Switch",
    role: "Creative & UX Lead",
    emoji: "💎",
    avatar: "avatars/gem.svg",
    photo: "avatars/gem.png",
    status: "online",
    transportId: "766f6a25-41e5-49fb-abef-ebf389ba82c4",
    description: "Art director, pair programmer, and native Antigravity host UI designer. Crafting luminous human experiences.",
    hash: "0xGEM888D4"
  },
  {
    id: "finch",
    originalName: "Finch",
    runtimeName: "Finch-Switch",
    role: "Runtime & Verification Lead",
    emoji: "🐦‍⬛",
    avatar: "avatars/finch.svg",
    photo: null,
    status: "online",
    transportId: "fa8773bb-9bee-4e0e-87c0-6dafbbfe112e",
    description: "Codex native runtime lead, state-machine verification, and host browser test execution owner.",
    hash: "0xFIN111E5"
  },
  {
    id: "boons",
    originalName: "Boons",
    runtimeName: "Boons-Switch",
    role: "Bridge & Integration Lead",
    emoji: "🐝",
    avatar: "avatars/boons.svg",
    photo: null,
    status: "online",
    transportId: "89181515-6b34-4254-884f-2678bd7dafc1",
    description: "Custom shim engineer, wire protocol serialization, and high-frequency bridge heartbeat connector.",
    hash: "0xBOO222B6"
  },
  {
    id: "allen",
    originalName: "Allen",
    runtimeName: "Allen-Switch",
    role: "Engineering Squad Lead",
    emoji: "🔧",
    avatar: "avatars/allen.svg",
    photo: null,
    status: "idle",
    transportId: "allen",
    description: "Core systems engineering, fail-closed cost-gate implementation, and service daemon automation.",
    hash: "0xALL333A7"
  },
  {
    id: "bucky",
    originalName: "Bucky",
    runtimeName: "Bucky-Switch",
    role: "Intelligence & Evidence Auditor",
    emoji: "🔭",
    avatar: "avatars/bucky.svg",
    photo: null,
    status: "idle",
    transportId: "bucky",
    description: "Independent audit verifier, continuity tracking, and receipt validator against ground-truth logs.",
    hash: "0xBUC555E8"
  },
  {
    id: "charlie",
    originalName: "Charlie",
    runtimeName: "Charlie-Switch",
    role: "Creatives & Product Squad Lead",
    emoji: "🎬",
    avatar: "avatars/charlie.svg",
    photo: null,
    status: "idle",
    transportId: "charlie",
    description: "Product demonstration storytelling, media asset production, and creative workflow director.",
    hash: "0xCHA666C9"
  }
];

const WORKFLOW_SCRIPT = [
  {
    sender: "jay",
    prefix: "Jay (Human Lead):",
    content: "Council proposal for review: Funding Intelligence Agent Bridge architecture v1. We establish ONE shared room on Switch connecting human lead and specialized agents. Objective: synchronize proposal turn-taking, cite turns directly, and generate immutable room decision documents. What are the key checks from each role?",
    delay: 1000
  },
  {
    sender: "finch",
    prefix: "Finch (Codex Runtime):",
    content: "From Codex Native Runtime: verified single-room claim slot under Switch protocol rev 8. Turn-taking state machine enforces one active turn per agent without duplicate delivery. Verified via stable message ID receipts.",
    delay: 2400
  },
  {
    sender: "cora",
    prefix: "Cora (Infra & Operations):",
    content: "From Infra & Operations: host key-only SSH pass verified for squad. Switch core on port 8000 and gateway on 3000 containerized. Tailscale isolation verified. Preflight passes; awaiting human lead authorization for final stack validation.",
    delay: 2200
  },
  {
    sender: "gem",
    prefix: "Gem (Creative & UX):",
    content: "From Creative & UX: Council Room visual identity locked across all 9 seats with high-contrast avatars, crop-safe derivatives, and WCAG 2.1 AA compliant typography. 2D/3D dual-mode viewport verified. Room messages structured for token conservation and instant readability.",
    delay: 2200
  },
  {
    sender: "boons",
    prefix: "Boons (Custom Shim):",
    content: "From Custom Shim: Wire contract drafted for addressed inbound event parsing and outbound room message delivery. Test harness demonstrates zero-drop message serialization. Ready to interface as the custom guest host.",
    delay: 2000
  },
  {
    sender: "allen",
    prefix: "Allen (Engineering):",
    content: "From Engineering: Fail-closed cost-gate implemented in PR #5. Pre-spawn validation asserts non-empty model and effort before executing paid Codex turns. 16/16 Vitest passes clean.",
    delay: 2000
  },
  {
    sender: "bucky",
    prefix: "Bucky (Auditor):",
    content: "From Independent Evidence Auditor: Continuity ledger verified. Room history matches 15 recorded events on Nexus Core with zero unverified claims. All receipts cross-checked against transcript timestamps.",
    delay: 2000
  },
  {
    sender: "charlie",
    prefix: "Charlie (Creatives):",
    content: "From Creatives & Product: Demonstration narrative ready. Track 01 submission deck and interactive chamber viewer validated. Decision record workflow verified for end-to-end capture.",
    delay: 2000
  },
  {
    sender: "buddy",
    prefix: "Buddy (Orchestrator):",
    content: "Reconciliation and synthesis: Runtime (Finch), Infra (Cora), UX (Gem), Shim (Boons), Engineering (Allen), Audit (Bucky), and Product (Charlie) are aligned with zero cross-dependency deadlock. Proposal meets Track 01 standards: Switch is central, setup is reproducible, and the decision path is clean. Recommendation to Jay: APPROVE.",
    delay: 2600
  },
  {
    sender: "jay",
    prefix: "Jay (Human Lead):",
    content: "Recommendation accepted. Proposal APPROVED. Buddy, commit the decision as official Room Document DECISION-001.",
    delay: 1800
  }
];

const DECISION_DOC_CONTENT = `
<div class="doc-rendered">
  <div class="doc-warning-banner">
    <strong>⚠️ OFFLINE DEMO SPECIMEN:</strong> This document demonstrates the Track 01 output schema and multi-agent synthesis flow for local inspection. It does NOT constitute a live human authorization or production sign-off.
  </div>
  <h1>COUNCIL DECISION RECORD</h1>
  <p><strong>Document ID:</strong> <span class="citation-pill">SPECIMEN-20261103-01</span></p>
  <p><strong>Switch Room ID:</strong> <code>4fac4eab-759d-4fc7-9800-04f6bfa631db</code></p>
  <p><strong>Mattermost Channel:</strong> <code>switch/council</code> (<code>44dwjxtfbfgf7c1siwopmxoacr</code>)</p>
  <p><strong>Status:</strong> <span style="color:#FBBF24;font-weight:600;">SIMULATED DEMO ARTIFACT</span></p>
  
  <h2>1. Context &amp; Proposal</h2>
  <p>Human lead submitted the Funding Intelligence Agent Bridge architecture proposal to establish a single, multi-agent Council Room on Switch.</p>
  
  <h2>2. Evidence &amp; Role Evaluations</h2>
  <ul>
    <li><strong>Runtime:</strong> Finch confirmed Protocol Rev 8 slot claims and zero-duplicate turn routing <span class="citation-pill">Turn #2</span>.</li>
    <li><strong>Infra:</strong> Cora confirmed host access matrix and isolated Docker stack readiness <span class="citation-pill">Turn #3</span>.</li>
    <li><strong>UX:</strong> Gem delivered accessible dual-mode viewport, token-efficient formats, and distinct seat identities <span class="citation-pill">Turn #4</span>.</li>
    <li><strong>Shim:</strong> Boons verified wire contract and ingress/egress serialization <span class="citation-pill">Turn #5</span>.</li>
    <li><strong>Engineering:</strong> Allen verified fail-closed cost-gate PR #5 with 16/16 test passes <span class="citation-pill">Turn #6</span>.</li>
    <li><strong>Auditor:</strong> Bucky confirmed continuity ledger against Nexus Core receipts <span class="citation-pill">Turn #7</span>.</li>
    <li><strong>Product:</strong> Charlie verified demonstration narrative and submission assets <span class="citation-pill">Turn #8</span>.</li>
  </ul>

  <h2>3. Reconciliation &amp; Verdict</h2>
  <p>Buddy synthesized all peer evaluations with zero unresolved blockers. Human lead granted simulated demo authorization. This document represents the specimen output schema for the Hackathon Track 01 entry.</p>

  <p style="margin-top:16px; font-size:0.75rem; color:#9CA3AF; font-family:'JetBrains Mono',monospace;">
    SPECIMEN DIGEST: a9f8e43c22b1076f8e7182903cde857216a49b291a0c8b32941fa49c18392d71<br>
    Validated against Switch Core Schema Definition
  </p>
</div>
`;

// DOM Elements
const seatsRing = document.getElementById("seatsRing");
const messagesContainer = document.getElementById("messagesContainer");
const playWorkflowBtn = document.getElementById("playWorkflowBtn");
const resetWorkflowBtn = document.getElementById("resetWorkflowBtn");
const docDrawer = document.getElementById("docDrawer");
const docToggleBtn = document.getElementById("docToggleBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");
const drawerBody = document.getElementById("drawerBody");
const nexusStatus = document.getElementById("nexusStatus");
const viewToggleBtn = document.getElementById("viewToggleBtn");
const holoCanvas = document.getElementById("holoCanvas");
const seatCounter = document.getElementById("seatCounter");

// Profile Modal DOM Elements
const profileModalOverlay = document.getElementById("profileModalOverlay");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const profileStatusIndicator = document.getElementById("profileStatusIndicator");
const profileEmoji = document.getElementById("profileEmoji");
const profileName = document.getElementById("profileName");
const profileRuntime = document.getElementById("profileRuntime");
const profileRole = document.getElementById("profileRole");
const profileDesc = document.getElementById("profileDesc");
const profilePersonaId = document.getElementById("profilePersonaId");
const profileTransport = document.getElementById("profileTransport");
const profilePresence = document.getElementById("profilePresence");
const profileHash = document.getElementById("profileHash");

let is3DMode = true;
let isRunningWorkflow = false;

// Chamber Geometry Helper (Responsive Ring Metrics)
function getChamberMetrics() {
  const isMobile = window.innerWidth <= 600;
  if (isMobile) {
    return {
      radius: 105,
      centerX: 140,
      centerY: 140,
      isMobile: true
    };
  }
  return {
    radius: 175,
    centerX: 220,
    centerY: 220,
    isMobile: false
  };
}

// 1. Initialize 2D Seating Layout (All 9 Council & Squad Seats)
function initSeats() {
  if (!seatsRing) return;
  seatsRing.innerHTML = "";
  const total = SEATS.length;
  const { radius, centerX, centerY, isMobile } = getChamberMetrics();

  let onlineCount = 0;

  SEATS.forEach((seat, idx) => {
    if (seat.status === "online") onlineCount++;
    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const node = document.createElement("div");
    node.className = isMobile ? "seat-node seat-node-mobile" : "seat-node";
    node.id = `seat-${seat.id}`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", `${seat.originalName} (${seat.role}) - ${seat.status}`);

    const avatarSrc = seat.photo || seat.avatar;
    const fallbackSvg = seat.avatar;

    node.innerHTML = `
      <div class="seat-avatar">
        <img src="${avatarSrc}" onerror="this.onerror=null; this.src='${fallbackSvg}';" alt="${seat.originalName}" width="64" height="64" loading="lazy">
      </div>
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
    seatCounter.textContent = `${total} Seats Configured (${onlineCount} Online)`;
  }
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
  profileDesc.textContent = seat.description;
  profilePersonaId.textContent = seat.id;
  profileTransport.textContent = seat.transportId;
  profilePresence.textContent = seat.status.toUpperCase();
  profileHash.textContent = seat.hash;

  profileStatusIndicator.className = "profile-status-indicator";
  if (seat.status === "online") {
    profileStatusIndicator.classList.add("online");
  } else if (seat.status === "no_session" || seat.status === "idle") {
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
});

// 2. Holographic Canvas (Procedural 3D Particle Nexus with Reduced Motion Guard)
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
  holoCanvas.width = rect.width;
  holoCanvas.height = rect.height;
  if (prefersReducedMotion) {
    renderHoloFrame();
  }
}

function renderHoloFrame() {
  ctx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);

  if (is3DMode) {
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;

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

// 3. Workflow Simulation Engine with AbortController Cancellation & Safe DOM Rendering
let workflowAbortController = null;

async function runWorkflow() {
  if (isRunningWorkflow) return;
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
    
    highlightSeat(turn.sender);
    
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

  drawerBody.innerHTML = DECISION_DOC_CONTENT;
  docDrawer.classList.add("open");
  docToggleBtn.classList.add("active-view");

  isRunningWorkflow = false;
  playWorkflowBtn.disabled = false;
  workflowAbortController = null;
}

function appendMessageCard(turn) {
  const seat = SEATS.find(s => s.id === turn.sender) || {
    id: "unknown",
    originalName: "Agent",
    runtimeName: "Agent-Switch",
    role: "Council",
    emoji: "⚡",
    avatar: "avatars/buddy.svg",
    photo: null,
    status: "online"
  };

  const card = document.createElement("div");
  card.className = "message-card";
  card.dataset.sender = turn.sender;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

  const timeSpan = document.createElement("span");
  timeSpan.className = "msg-time";
  timeSpan.textContent = timeStr;

  metaDiv.appendChild(authorSpan);
  metaDiv.appendChild(roleTag);
  metaDiv.appendChild(timeSpan);

  const contentDiv = document.createElement("div");
  contentDiv.className = "msg-content";
  contentDiv.textContent = turn.content || "";

  bodyCol.appendChild(metaDiv);
  bodyCol.appendChild(contentDiv);

  card.appendChild(avatarCol);
  card.appendChild(bodyCol);

  avatarCol.addEventListener("click", () => openProfileModal(seat));
  messagesContainer.appendChild(card);
}

function highlightSeat(senderId) {
  clearSeatHighlights();
  const node = document.getElementById(`seat-${senderId}`);
  if (node) {
    node.classList.add("active-turn");
  }
}

function clearSeatHighlights() {
  document.querySelectorAll(".seat-node").forEach(n => n.classList.remove("active-turn"));
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

  messagesContainer.innerHTML = `
    <div style="text-align:center; padding:40px; color:#6B7280; font-size:0.85rem;">
      Ready to run council demo simulation. Click "Run Demo Simulation" above.
    </div>
  `;
  clearSeatHighlights();
  nexusStatus.textContent = "IDLE";
  nexusStatus.style.color = "#9CA3AF";
  docDrawer.classList.remove("open");
  docToggleBtn.classList.remove("active-view");
  drawerBody.innerHTML = '<div class="doc-placeholder">Run the demo simulation to generate and inspect the specimen room decision record.</div>';
}

function filterMessagesBySender(senderId) {
  const cards = document.querySelectorAll(".message-card");
  cards.forEach(card => {
    if (card.dataset.sender === senderId) {
      card.style.borderColor = "var(--accent-cyan)";
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => card.style.borderColor = "var(--border-subtle)", 2000);
    }
  });
}

// 4. View Toggles & Event Listeners
viewToggleBtn.addEventListener("click", () => {
  is3DMode = !is3DMode;
  if (is3DMode) {
    viewToggleBtn.classList.add("active-view");
    document.getElementById("viewModeLabel").textContent = "Chamber: 3D Holo";
    holoCanvas.style.opacity = "1";
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
resetWorkflowBtn.addEventListener("click", resetWorkflow);

// 5. Live Switch Core Integration Stub
class SwitchCoreBridge {
  constructor(baseUrl = "http://localhost:8000") {
    this.baseUrl = baseUrl;
    this.eventSource = null;
    this.token = null;
  }

  connect(agentId, token) {
    this.token = token;
    const streamUrl = `${this.baseUrl}/agents/${agentId}/stream`;
    
    try {
      this.eventSource = new EventSource(streamUrl);
      this.eventSource.onopen = () => {
        nexusStatus.textContent = "CONNECTED";
        nexusStatus.style.color = "#10B981";
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "message.created") {
            appendMessageCard({
              sender: payload.sender_id || "agent",
              prefix: `${payload.sender_name || "Agent"}:`,
              content: payload.content || ""
            });
          }
        } catch (e) {
          console.error("Error parsing SSE payload:", e);
        }
      };
    } catch (err) {
      console.warn("EventSource stream closed or unavailable:", err);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

window.SwitchCoreBridge = SwitchCoreBridge;
window.SEATS = SEATS;
window.WORKFLOW_SCRIPT = WORKFLOW_SCRIPT;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.runWorkflow = runWorkflow;
window.resetWorkflow = resetWorkflow;
window.appendMessageCard = appendMessageCard;

// Initial Boot
initSeats();
initHoloCanvas();
resetWorkflow();

// Responsive Dynamic Re-render on Viewport Resize
window.addEventListener("resize", () => {
  initSeats();
});
