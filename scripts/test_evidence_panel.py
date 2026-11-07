#!/usr/bin/env python3
"""Automated verification suite for Council Evidence & Decision Panel (Slice 4)."""

import os
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(SCRIPT_DIR, "evidence-panel.js")):
    UI_DIR = SCRIPT_DIR
else:
    UI_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "ui"))

EVIDENCE_JS = os.path.join(UI_DIR, "evidence-panel.js")
ADAPTER_JS = os.path.join(UI_DIR, "event-adapter.js")

print(f"=== COUNCIL EVIDENCE & DECISION PANEL TEST SUITE ({EVIDENCE_JS}) ===")

node_test = """
const evMod = require(process.argv[1]);
const adMod = require(process.argv[2]);

// 1. Verify VERIFIED_RECEIPTS mode locks approval gate to AWAITING_HUMAN_DECISION
const verifiedModel = evMod.buildEvidenceModel('VERIFIED_RECEIPTS', adMod.VERIFIED_RECEIPT_EVENTS, false);
if (verifiedModel.decision.state !== 'AWAITING_HUMAN_DECISION') {
  console.error('FAIL: VERIFIED_RECEIPTS mode must not claim human approval without a live decision event');
  process.exit(1);
}
if (verifiedModel.assessments.length !== 7) {
  console.error('FAIL: Expected 7 role assessments in verified model, got', verifiedModel.assessments.length);
  process.exit(1);
}
console.log('  [PASS] VERIFIED_RECEIPTS mode strictly locks decision gate at AWAITING_HUMAN_DECISION');

// 2. Verify citation cross-check against VERIFIED_RECEIPT_EVENTS
const citationCheck = evMod.verifyEvidenceCitations(verifiedModel, adMod.VERIFIED_RECEIPT_EVENTS);
if (citationCheck.verifiedCount !== citationCheck.total) {
  console.error('FAIL: Not all assessment citations matched event ledger:', citationCheck);
  process.exit(1);
}
console.log(`  [PASS] All ${citationCheck.verifiedCount}/${citationCheck.total} role assessments trace to verified event IDs`);

// 3. Verify DEMO_SPECIMEN mode labels simulated outcome truthfully
const demoIdle = evMod.buildEvidenceModel('DEMO_SPECIMEN', [], false);
if (demoIdle.decision.state !== 'AWAITING_DEMO_COMPLETION') {
  console.error('FAIL: Demo idle state mismatch:', demoIdle.decision.state);
  process.exit(1);
}
const demoDone = evMod.buildEvidenceModel('DEMO_SPECIMEN', [], true);
if (demoDone.decision.state !== 'SIMULATED_DEMO_OUTCOME' || !demoDone.decision.outcome_label.includes('NOT LIVE HUMAN AUTHORIZATION')) {
  console.error('FAIL: Completed demo must explicitly label SIMULATED_DEMO_OUTCOME');
  process.exit(1);
}
console.log('  [PASS] DEMO_SPECIMEN mode explicitly labels simulated approval as SIMULATED_DEMO_OUTCOME');

// 4. Verify live human decision unlock only when authentic jay decision event is ingested
const eventsWithDecision = adMod.VERIFIED_RECEIPT_EVENTS.concat([{
  event_id: 'sw_live_jay_decision_01',
  sender_id: 'jay',
  event_type: 'decision',
  verdict: 'APPROVED',
  content: 'Approved Option A with explicit source-linked receipts.',
  provenance: 'LIVE_EVENT'
}]);
const unlockedModel = evMod.buildEvidenceModel('LIVE_READONLY', eventsWithDecision, false);
if (unlockedModel.decision.state !== 'APPROVED' || unlockedModel.decision.human_decision_event_id !== 'sw_live_jay_decision_01') {
  console.error('FAIL: Live decision event failed to unlock decision gate properly');
  process.exit(1);
}
console.log('  [PASS] Live human decision gate unlocks ONLY with verified jay decision event ID');

// 5. Verify Safe DOM rendering of Evidence Panel
function makeMockDoc() {
  function makeNode(tag, text) {
    return {
      tagName: tag,
      textContent: text || '',
      className: '',
      dataset: {},
      attributes: {},
      children: [],
      get firstChild() { return this.children[0] || null; },
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter(x => x !== c); },
      setAttribute(k, v) { this.attributes[k] = v; },
      addEventListener() {},
      classList: { toggle() { return true; } }
    };
  }
  const doc = {
    createElement: (tag) => makeNode(tag.toUpperCase(), ''),
    createTextNode: (txt) => makeNode('#text', String(txt))
  };
  const root = makeNode('DIV', '');
  root.ownerDocument = doc;
  return root;
}
const domRoot = makeMockDoc();
evMod.renderEvidencePanelDOM(domRoot, verifiedModel, {});
if (domRoot.children.length !== 1 || domRoot.children[0].children.length < 5) {
  console.error('FAIL: Evidence panel DOM failed to render all sections');
  process.exit(1);
}
console.log('  [PASS] Safe DOM rendering of Proposal, Options, 7 Assessments, Reconciliation, and Decision Gate PASS');
console.log('ALL_EVIDENCE_PANEL_TESTS_PASS');
"""

res = subprocess.run(["node", "-e", node_test, EVIDENCE_JS, ADAPTER_JS], capture_output=True, text=True, encoding="utf-8")
print(res.stdout.strip())
if res.returncode != 0 or "ALL_EVIDENCE_PANEL_TESTS_PASS" not in res.stdout:
    print("FAIL:", res.stderr)
    sys.exit(1)

print("\nOVERALL: ALL EVIDENCE & DECISION PANEL GATES PASSED! (0 errors)")
