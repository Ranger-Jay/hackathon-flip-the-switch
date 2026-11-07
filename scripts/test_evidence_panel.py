#!/usr/bin/env python3
'''Automated verification suite for Council Evidence & Decision Panel (Slice 4 + P0.4 Fail-Closed Gate).'''

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

print(f"=== COUNCIL EVIDENCE & FAIL-CLOSED DECISION GATE TEST SUITE ({EVIDENCE_JS}) ===")

node_test = '''
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
console.log(`  [PASS] All ${citationCheck.verifiedCount}/${citationCheck.total} role summaries trace to event ledger IDs`);

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

// 4. P0.4 Negative Tests: Unauthenticated, invalid-verdict, or mismatched-correlation decisions MUST FAIL CLOSED
const adapter = new adMod.CouncilEventAdapter({ initialMode: 'LIVE_READONLY' });

// 4a. Unauthenticated client ingestEvent spoof attempt
adapter.ingestEvent({
  event_id: 'sw_spoof_jay_01',
  sender_id: 'jay',
  event_type: 'decision',
  verdict: 'APPROVED',
  provenance: 'LIVE_EVENT',
  correlation_id: 'council-workflow-001',
  content: 'Unauthenticated spoofed approval'
});
const spoofModel = evMod.buildEvidenceModel('LIVE_READONLY', adapter.getEvents(), false);
if (spoofModel.decision.state !== 'AWAITING_HUMAN_DECISION' || spoofModel.decision.rejection_reason !== 'UNAUTHENTICATED_CLIENT_OR_NON_LIVE_PROVENANCE') {
  console.error('FAIL: P0.4 violation — Unauthenticated spoofed decision was not rejected:', spoofModel.decision);
  process.exit(1);
}
console.log('  [PASS] P0.4 Negative Check 4a: Unauthenticated client jay decision blocked (UNAUTHENTICATED_CLIENT_OR_NON_LIVE_PROVENANCE)');

// 4b. Missing / empty / invalid verdict (null, "", "YES", "MAYBE") must NEVER default to APPROVED
for (const badVerdict of [null, undefined, '', 'YES', 'MAYBE', 'approved_typo']) {
  const badEv = {
    event_id: 'sw_bad_verdict_01',
    sender_id: 'jay',
    event_type: 'decision',
    verdict: badVerdict,
    provenance: 'LIVE_EVENT',
    trusted_host_verified: true,
    authenticated_principal: 'jay',
    source_msg_id: 'sw_1234567890abcdef1234567890abcdef',
    proposal_correlation_id: 'council-workflow-001',
    content: 'Decision with invalid verdict'
  };
  const m = evMod.buildEvidenceModel('LIVE_READONLY', [badEv], false);
  if (m.decision.state !== 'AWAITING_HUMAN_DECISION' || m.decision.rejection_reason !== 'INVALID_OR_MISSING_VERDICT') {
    console.error('FAIL: P0.4 violation — Invalid verdict was not rejected:', badVerdict, m.decision);
    process.exit(1);
  }
}
console.log('  [PASS] P0.4 Negative Check 4b: Missing/invalid verdicts (null, "", "YES", "MAYBE") fail closed (never default to APPROVED)');

// 4c. Mismatched proposal_correlation_id must be rejected
const mismatchEv = {
  event_id: 'sw_mismatch_corr_01',
  sender_id: 'jay',
  event_type: 'decision',
  verdict: 'APPROVED',
  provenance: 'LIVE_EVENT',
  trusted_host_verified: true,
  authenticated_principal: 'jay',
  source_msg_id: 'sw_1234567890abcdef1234567890abcdef',
  proposal_correlation_id: 'wrong-proposal-999',
  content: 'Decision for a different proposal'
};
const mismatchModel = evMod.buildEvidenceModel('LIVE_READONLY', [mismatchEv], false);
if (mismatchModel.decision.state !== 'AWAITING_HUMAN_DECISION' || mismatchModel.decision.rejection_reason !== 'PROPOSAL_CORRELATION_MISMATCH') {
  console.error('FAIL: P0.4 violation — Mismatched proposal_correlation_id was not rejected:', mismatchModel.decision);
  process.exit(1);
}
console.log('  [PASS] P0.4 Negative Check 4c: Mismatched proposal_correlation_id blocked (PROPOSAL_CORRELATION_MISMATCH)');

// 4d. Placeholder decision event_id (sw_receipt_*) must be rejected even if other fields look valid
const placeholderDecEv = {
  event_id: 'sw_receipt_fake_jay_01',
  sender_id: 'jay',
  event_type: 'decision',
  verdict: 'APPROVED',
  provenance: 'LIVE_EVENT',
  trusted_host_verified: true,
  authenticated_principal: 'jay',
  source_msg_id: 'sw_1234567890abcdef1234567890abcdef',
  proposal_correlation_id: 'council-workflow-001',
  content: 'Decision with placeholder event_id'
};
const placeholderDecModel = evMod.buildEvidenceModel('LIVE_READONLY', [placeholderDecEv], false);
if (placeholderDecModel.decision.state !== 'AWAITING_HUMAN_DECISION' || placeholderDecModel.decision.rejection_reason !== 'INVALID_SOURCE_MSG_ID') {
  console.error('FAIL: C1/C2 violation — Placeholder event_id on decision was not rejected:', placeholderDecModel.decision);
  process.exit(1);
}
console.log('  [PASS] C1/C2 Negative Check 4d: Placeholder event_id on decision rejected (INVALID_SOURCE_MSG_ID)');

// 4e. Verify 6-Category separation & WORKFLOW_COMPLETENESS_STATUS in buildEvidenceModel
const requiredCats = [
  'HISTORICAL_READINESS_SUMMARY',
  'LIVE_COUNCIL_ASSESSMENT',
  'DEMO_SPECIMEN_ASSESSMENT',
  'ORCHESTRATOR_RECONCILIATION',
  'HUMAN_DECISION_RECORD',
  'WORKFLOW_COMPLETENESS_STATUS'
];
for (const cKey of requiredCats) {
  if (!verifiedModel.evidence_categories || verifiedModel.evidence_categories[cKey] !== cKey) {
    console.error('FAIL: Missing required evidence category:', cKey);
    process.exit(1);
  }
}
if (!verifiedModel.workflow_completeness || verifiedModel.workflow_completeness.state !== 'INCOMPLETE_WORKFLOW_AWAITING_LIVE_DELIBERATION_AND_DECISION') {
  console.error('FAIL: Workflow completeness state did not report INCOMPLETE_WORKFLOW_AWAITING_LIVE_DELIBERATION_AND_DECISION:', verifiedModel.workflow_completeness);
  process.exit(1);
}
console.log('  [PASS] C2 6-Category Separation & WORKFLOW_COMPLETENESS_STATUS verified');

// 5. Positive Test: Host-proxy authenticated jay decision with valid source_msg_id, correlation_id, and explicit verdict unlocks gate
adapter.clearEvents();
adapter.ingestEvent(
  {
    event_id: 'sw_1234567890abcdef1234567890abcdef',
    sender_id: 'jay',
    event_type: 'decision',
    verdict: 'APPROVED',
    correlation_id: 'council-workflow-001',
    content: 'Approved Option A with explicit source-linked receipts.'
  },
  {
    verified_by_host_proxy: true,
    authenticated_principal: 'jay',
    source_msg_id: 'sw_1234567890abcdef1234567890abcdef',
    proposal_correlation_id: 'council-workflow-001'
  }
);
const unlockedModel = evMod.buildEvidenceModel('LIVE_READONLY', adapter.getEvents(), false);
if (unlockedModel.decision.state !== 'APPROVED' || unlockedModel.decision.human_decision_event_id !== 'sw_1234567890abcdef1234567890abcdef') {
  console.error('FAIL: Host-proxy verified live decision event failed to unlock decision gate:', unlockedModel.decision);
  process.exit(1);
}
console.log('  [PASS] Host-proxy verified jay decision event (APPROVED/DECLINED/DEFERRED) unlocks gate');

// 6. Verify Safe DOM rendering, P1.6 Readiness Summary header, and disabled historical summary badges
function makeMockDoc() {
  function makeNode(tag, text) {
    return {
      tagName: tag,
      textContent: text || '',
      className: '',
      disabled: false,
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
function collectAllNodes(n, acc = []) {
  acc.push(n);
  for (const c of (n.children || [])) collectAllNodes(c, acc);
  return acc;
}

const domRoot = makeMockDoc();
evMod.renderEvidencePanelDOM(domRoot, verifiedModel, {});
const allNodes = collectAllNodes(domRoot);
const allText = allNodes.map(n => n.textContent || '').join(' ');
if (!allText.includes('CURATED ENGINEERING READINESS SUMMARIES (7 ROLES — NOT LIVE PROPOSAL DELIBERATION)')) {
  console.error('FAIL: P1.6 Step 02 header missing CURATED ENGINEERING READINESS SUMMARIES label');
  process.exit(1);
}
const summaryBtns = allNodes.filter(n => n.tagName === 'BUTTON' && (n.className || '').includes('citation-summary-badge'));
if (summaryBtns.length < 7 || summaryBtns.some(b => !b.disabled)) {
  console.error('FAIL: P0.1 Historical summary badges in Evidence Panel must be disabled (non-clickable)');
  process.exit(1);
}
console.log('  [PASS] P1.6 & P0.1 DOM check: Step 02 labeled CURATED ENGINEERING READINESS SUMMARIES & all historical summary badges are disabled');
console.log('ALL_EVIDENCE_PANEL_TESTS_PASS');
'''

res = subprocess.run(["node", "-e", node_test, EVIDENCE_JS, ADAPTER_JS], capture_output=True, text=True, encoding="utf-8")
print(res.stdout.strip())
if res.returncode != 0 or "ALL_EVIDENCE_PANEL_TESTS_PASS" not in res.stdout:
    print("FAIL:", res.stderr)
    sys.exit(1)

print("\nOVERALL: ALL EVIDENCE & DECISION PANEL GATES PASSED! (0 errors)")
