# Switch Council Chamber UI (`ui/`)

Interactive 9-seat Council Chamber, Evidence & Decision Panel, Boons Operator Presentation Mode, and Mattermost 12.0.1 WebApp Plugin Host Harness for the **Flip the Switch (Track 01)** hackathon.

## Key Files
- `index.html`: Main Council Chamber interface (`VERIFIED_RECEIPTS`, `DEMO_SPECIMEN`, and `LIVE_READONLY` modes).
- `mm-harness.html`: Mattermost 12.0.1 WebApp Plugin Host Harness mounting `plugin-bundle.js` (`com.switch.council-chamber`).
- `app.js`: Chamber controller, responsive 9-seat circular layout, 3D holographic canvas (`prefers-reduced-motion` aware), keyboard modal focus trap, and Operator Presentation Mode.
- `event-adapter.js`: Canonical event adapter, `event_id` idempotent deduplication, honest 7-state seat status model, and XSS-safe markdown/DOM renderer.
- `evidence-panel.js`: Expandable Evidence & Decision Record drawer with source-linked role assessments, material options/tradeoffs, orchestrator reconciliation, and truthful human decision gate.
- `style.css`: Responsive glassmorphic styling verified across `1440×900`, `1280×800`, `768×1024`, `390×844`, and `360×800`.
- `avatars/`: Official 176×176 PNG portraits (`*.png`) and vector SVG fallbacks (`*.svg`) for all 9 Council & Squad seats.
- `captures/`: Automated Headless Chrome multi-viewport verification screenshots.

## Running Verification Suites
From the repository root:
```bash
python scripts/run_all_ui_checks.py
```
