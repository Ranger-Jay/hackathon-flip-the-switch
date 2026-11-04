# Council Room — Interactive Interface & Avatar System

Part of the **Flip the Switch Hackathon (Track 01: Best Business Workflow)**.

This interface provides an accessible, interactive representation of the **one durable Council Room workflow**:
**Proposal → Agent In-Role Reviews → Reconciliation & Synthesis → Human Decision → Room Decision Record**.

---

## 1. Architecture & Design Principles

* **Dual-Mode Chamber Viewport:**
  * **3D Holographic Particle Nexus:** Built using canvas procedural projection without external 3D engine overhead (<45KB total footprint). Rotates smoothly with active turn highlights.
  * **2D Seating Ring (Accessibility & Low Power):** Clean, WCAG 2.1 AA compliant circular seating layout evenly positioning all 9 Council and Squad seats ($40^\circ$ radial separation).
* **Avatar & Visual Identity System:**
  * **Resilient Multi-Tier Asset Pipeline:** Attempts to render high-resolution 1:1 circular crop portraits (`ui/avatars/*.png`). If the image is missing, fails, or times out, seamlessly falls back via `onerror` to bespoke geometric vector badges (`ui/avatars/*.svg`). If images are disabled, accessible emojis and names display cleanly.
  * **Participant Profile Inspector:** Clicking any chamber seat or message avatar opens a modal displaying the persona's full high-res portrait, original channel name, runner runtime name (`Name-Switch`), role, stable persona ID, Switch transport ID mapping, and real session state.
* **Live Turn-Taking Stream:**
  * Chronological conversation stream matching Switch Protocol Rev 8 turn semantics with instant speaker highlight synchronization.
* **Sidecar Room Document Drawer:**
  * Formatted preview of the generated room decision document (`DECISION-20261103-01`).
  * Explicit citation pills linking back to exact turns in the conversation.
* **Switch Core SSE / WebSocket Bridge:**
  * Client stub in `app.js` (`SwitchCoreBridge`) ready to subscribe to `/agents/{agent_id}/stream`.

---

## 2. Participant Identity Roster (Aligned with `agents/registry.json`)

| Persona ID | Original Name | Runner Name | Emoji | Role | Avatar Asset |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `jay` | Jay | Jay | 🐕 | Human Lead & Authorizer | `avatars/jay.svg` |
| `buddy` | Buddy | Buddy-Switch | 🦅 | Architect, Conductor & Synthesizer | `avatars/buddy.svg` |
| `cora` | Cora | Cora-Switch | 🎖️ | Operations Lead & Company Commander | `avatars/cora.svg` |
| `gem` | Gem | Gem-Switch | 💎 | Creative & UX Lead, Art Director | `avatars/gem.png` / `gem.svg` |
| `finch` | Finch | Finch-Switch | 🐦‍⬛ | Runtime & Verification Lead | `avatars/finch.svg` |
| `boons` | Boons | Boons-Switch | 🐝 | Custom Bridge & Integration Lead | `avatars/boons.svg` |
| `allen` | Allen | Allen-Switch | 🔧 | Engineering Squad Lead | `avatars/allen.svg` |
| `bucky` | Bucky | Bucky-Switch | 🔭 | Intelligence & Evidence Auditor | `avatars/bucky.svg` |
| `charlie` | Charlie | Charlie-Switch | 🎬 | Creatives & Product Squad Lead | `avatars/charlie.svg` |

---

## 3. Native Switch Avatar Limitations (Observed Diagnostics)

During investigation of why deployed Switch Console / Core rejected custom agent avatars:
1. **API Route Availability:**
   - Upstream Switch introduced dedicated avatar routes (`PUT /agents/{agent_id}/icon`, `GET /agents/avatar-settings`, `GET /agents/icon-choices`) in ticket `CHOO-2171`.
   - The deployed Nexus Core build (`v0.31.0`) does not expose `PUT /agents/{agent_id}/icon` (`404 Not Found`) or avatar settings (`405 Method Not Allowed`). `PATCH /agents/{agent_id}` drops `icon_url` because `UpdateAgentRequest` only handles description, profile, and metadata. `POST /agents` requires an operator registration token (`401 Invalid registration token`).
2. **URL Type & MIME Validation:**
   - Switch Core's `agent_icon.py` requires an absolute `https://` link and prohibits private IPs (`192.168.1.153`), localhost, and plain HTTP.
   - External links like `prnt.sc/QPS0VrLpyQzR` return `text/html; charset=UTF-8` (Lightshot web viewer HTML) rather than direct binary image streams (`image/png`).
   - Google Drive links require Google authentication and return HTML or redirect (`accounts.google.com`), which browser `<img>` tags and Mattermost's image downloader fail to parse.
   - **Resolution:** The Council UI ships a standalone, first-class avatar presentation layer that renders local and hosted assets with zero reliance on missing Core icon routes.

---

## 4. How to Run & Verify Locally

No build pipeline or npm dependencies required:

```bash
cd ui
python -m http.server 3333
```
Open [http://localhost:3333](http://localhost:3333) in your browser.
