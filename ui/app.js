// Council Room — Accessible Chamber Interface
// Clean public implementation for Switch Hackathon (Track 01)

const SEATS = [
  { id: "jay", name: "Jay", role: "Human Lead", avatar: "avatars/jay.svg", status: "online", emoji: "🐕" },
  { id: "buddy", name: "Buddy", role: "Orchestrator", avatar: "avatars/buddy.svg", status: "online", emoji: "🦅" },
  { id: "finch", name: "Finch", role: "Codex Runtime", avatar: "avatars/finch.svg", status: "online", emoji: "🐦‍⬛" },
  { id: "cora", name: "Cora", role: "Infra & Ops", avatar: "avatars/cora.svg", status: "online", emoji: "🐘" },
  { id: "gem", name: "Gem", role: "Creative & UX", avatar: "avatars/gem.svg", status: "online", emoji: "💎" },
  { id: "boons", name: "Boons", role: "Custom Shim", avatar: "avatars/boons.svg", status: "online", emoji: "🌿" }
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
    content: "From Codex Native Runtime: verified single-room claim slot under Switch protocol rev 8. Turn-taking state machine enforces one active turn per agent without duplicate delivery. Recommendation: require all agent replies to cite the proposal message ID.",
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
    content: "From Creative & UX: Council Room visual identity locked across all 6 seats with high-contrast avatars and WCAG 2.1 AA compliant typography. 2D/3D dual-mode viewport verified. Room messages structured for token conservation and instant readability.",
    delay: 2200
  },
  {
    sender: "boons",
    prefix: "Boons (Custom Shim):",
    content: "From Custom Shim: Wire contract drafted for addressed inbound event parsing and outbound room message delivery. Test harness demonstrates zero-drop message serialization. Ready to interface as the custom guest host.",
    delay: 2000
  },
  {
    sender: "buddy",
    prefix: "Buddy (Orchestrator):",
    content: "Reconciliation and synthesis: Runtime (Finch), Infra (Cora), UX (Gem), and Shim (Boons) are aligned with zero cross-dependency deadlock. Proposal meets Track 01 standards: Switch is central, setup is reproducible, and the decision path is clean. Recommendation to Jay: APPROVE.",
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
  <h1>COUNCIL DECISION RECORD</h1>
  <p><strong>Document ID:</strong> <span class="citation-pill">DECISION-20261103-01</span></p>
  <p><strong>Room:</strong> <code>funding-intel-council</code></p>
  <p><strong>Status:</strong> <span style="color:#10B981;font-weight:600;">APPROVED & SEALED</span></p>
  
  <h2>1. Context & Proposal</h2>
  <p>Human lead submitted the Funding Intelligence Agent Bridge architecture proposal to establish a single, multi-agent Council Room on Switch.</p>
  
  <h2>2. Evidence & Role Evaluations</h2>
  <ul>
    <li><strong>Runtime:</strong> Finch confirmed Protocol Rev 8 slot claims and zero-duplicate turn routing <span class="citation-pill">Turn #2</span>.</li>
    <li><strong>Infra:</strong> Cora confirmed host access matrix and isolated Docker stack readiness <span class="citation-pill">Turn #3</span>.</li>
    <li><strong>UX:</strong> Gem delivered accessible dual-mode viewport, token-efficient formats, and distinct seat identities <span class="citation-pill">Turn #4</span>.</li>
    <li><strong>Shim:</strong> Boons verified wire contract and ingress/egress serialization <span class="citation-pill">Turn #5</span>.</li>
  </ul>

  <h2>3. Reconciliation & Verdict</h2>
  <p>Buddy synthesized all peer evaluations with zero unresolved blockers. Human lead granted formal authorization. This document represents the binding architecture baseline for the Hackathon Track 01 entry.</p>

  <p style="margin-top:16px; font-size:0.75rem; color:#9CA3AF; font-family:'JetBrains Mono',monospace;">
    SHA-256 HASH: a9f8e43c22b1076f8e7182903cde857216a49b291a0c8b32941fa49c18392d71<br>
    Recorded on Switch Core via FastMCP Bridge
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

let is3DMode = true;
let isRunningWorkflow = false;

// 1. Initialize 2D Seating Layout
function initSeats() {
  seatsRing.innerHTML = "";
  const total = SEATS.length;
  const radius = 170; // px
  const centerX = 220; // half of 440px ring
  const centerY = 220;

  SEATS.forEach((seat, idx) => {
    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const node = document.createElement("div");
    node.className = "seat-node";
    node.id = `seat-${seat.id}`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    node.innerHTML = `
      <div class="seat-avatar">
        <img src="${seat.avatar}" alt="${seat.name}" width="64" height="64">
      </div>
      <div class="seat-badge">${seat.emoji} ${seat.name}</div>
    `;

    node.addEventListener("click", () => {
      filterMessagesBySender(seat.id);
    });

    seatsRing.appendChild(node);
  });
}

// 2. Holographic Canvas (Procedural 3D Particle Nexus)
let ctx = holoCanvas.getContext("2d");
let animationFrameId;
let particles = [];
let angleOffset = 0;

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

  animateHolo();
}

function resizeCanvas() {
  const rect = holoCanvas.getBoundingClientRect();
  holoCanvas.width = rect.width;
  holoCanvas.height = rect.height;
}

function animateHolo() {
  ctx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);

  if (is3DMode) {
    const cx = holoCanvas.width / 2;
    const cy = holoCanvas.height / 2;
    angleOffset += 0.005;

    ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
    particles.forEach(p => {
      p.theta += p.speed;
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

  animationFrameId = requestAnimationFrame(animateHolo);
}

// 3. Workflow Simulation Engine
async function runWorkflow() {
  if (isRunningWorkflow) return;
  isRunningWorkflow = true;
  playWorkflowBtn.disabled = true;
  messagesContainer.innerHTML = "";
  nexusStatus.textContent = "IN SESSION";
  nexusStatus.style.color = "#00F0FF";

  for (let i = 0; i < WORKFLOW_SCRIPT.length; i++) {
    const turn = WORKFLOW_SCRIPT[i];
    
    highlightSeat(turn.sender);
    await new Promise(r => setTimeout(r, turn.delay));
    appendMessageCard(turn);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  clearSeatHighlights();
  nexusStatus.textContent = "DECIDED";
  nexusStatus.style.color = "#10B981";

  drawerBody.innerHTML = DECISION_DOC_CONTENT;
  docDrawer.classList.add("open");
  docToggleBtn.classList.add("active-view");

  isRunningWorkflow = false;
  playWorkflowBtn.disabled = false;
}

function appendMessageCard(turn) {
  const seat = SEATS.find(s => s.id === turn.sender) || {
    name: "Agent",
    role: "Council",
    avatar: "avatars/buddy.svg"
  };

  const card = document.createElement("div");
  card.className = "message-card";
  card.dataset.sender = turn.sender;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  card.innerHTML = `
    <div class="msg-avatar-col">
      <img src="${seat.avatar}" alt="${seat.name}">
    </div>
    <div class="msg-body-col">
      <div class="msg-meta">
        <span class="msg-author">${turn.prefix}</span>
        <span class="msg-role-tag">${seat.role}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      <div class="msg-content">${turn.content}</div>
    </div>
  `;

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
  messagesContainer.innerHTML = `
    <div style="text-align:center; padding:40px; color:#6B7280; font-size:0.85rem;">
      Ready to run council proposal workflow. Click "Run Proposal Workflow" above.
    </div>
  `;
  clearSeatHighlights();
  nexusStatus.textContent = "IDLE";
  nexusStatus.style.color = "#9CA3AF";
  docDrawer.classList.remove("open");
  docToggleBtn.classList.remove("active-view");
  drawerBody.innerHTML = '<div class="doc-placeholder">Run the workflow to generate and verify the official room decision document.</div>';
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

// Initial Boot
initSeats();
initHoloCanvas();
resetWorkflow();
