# Council Room — Interactive Interface

Part of the **Flip the Switch Hackathon (Track 01: Best Business Workflow)**.

This interface provides an accessible, interactive representation of the **one durable Council Room workflow**:
**Proposal → Agent In-Role Reviews → Reconciliation & Synthesis → Human Decision → Room Decision Record**.

---

## 1. Architecture & Design Principles

* **Dual-Mode Chamber Viewport:**
  * **3D Holographic Particle Nexus:** Built using canvas procedural projection without heavy external 3D engine overhead. Rotates smoothly with active turn highlights.
  * **2D Seating Ring (Fallback & Accessibility):** Clean, WCAG 2.1 AA compliant circular seating layout with SVG avatars for all 6 council roles.
* **Live Turn-Taking Stream:**
  * Chronological conversation stream matching Switch Protocol Rev 8 turn semantics.
* **Sidecar Room Document Drawer:**
  * Formatted preview of the generated room decision document (`DECISION-20261103-01.md`).
  * Explicit citation pills linking back to exact turns in the conversation.
* **Switch Core SSE / WebSocket Bridge:**
  * Pre-configured client stub in `app.js` (`SwitchCoreBridge`) ready to subscribe to `/agents/{agent_id}/stream` once Bearer tokens are provided.

---

## 2. Participant Identity Roster

| Role | Participant | Core Responsibility |
| :--- | :--- | :--- |
| **Human Lead** | Jay | Proposal submission, business authority, final approval gates |
| **Orchestrator** | Buddy | Cross-agent synthesis, evidence arbitration, decision drafting |
| **Native Codex** | Finch | Runtime verification, protocol slot claims, execution contracts |
| **Infra & Ops** | Cora | Host access audit, Docker health, Tailscale networking |
| **Creative & UX** | Gem | Interface design, avatar system, accessibility, Antigravity session |
| **Custom Shim** | Boons | External wire protocol translation, ingress/egress serialization |

---

## 3. How to Run Locally

No build pipeline required. To launch the interface:

```bash
cd ui
python -m http.server 3333
```
Open [http://localhost:3333](http://localhost:3333) in your browser, or open `index.html` directly in any modern browser.
