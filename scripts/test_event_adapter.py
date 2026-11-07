#!/usr/bin/env python3
'''Automated verification suite for CouncilEventAdapter, Honest Seat Statuses & Fail-Closed Ingestion (Slice 3 + P0 Hardening).'''

import os
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(SCRIPT_DIR, "event-adapter.js")):
    UI_DIR = SCRIPT_DIR
else:
    UI_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "ui"))

ADAPTER_JS = os.path.join(UI_DIR, "event-adapter.js")
print(f"=== COUNCIL EVENT ADAPTER & FAIL-CLOSED PROVENANCE TEST SUITE ({ADAPTER_JS}) ===")

node_script = '''
const mod = require(process.argv[1]);
const {
  OPERATING_MODES,
  HONEST_STATUS,
  STATUS_METADATA,
  VERIFIED_RECEIPT_EVENTS,
  CouncilEventAdapter,
  renderSafeMessageContent,
  isSafeHttpUrl
} = mod;

// 1. Verify Operating Modes & Honest Status definitions
if (!OPERATING_MODES.DEMO_SPECIMEN || !OPERATING_MODES.VERIFIED_RECEIPTS || !OPERATING_MODES.LIVE_READONLY) {
  console.error('FAIL: Missing required operating modes');
  process.exit(1);
}
const requiredStatuses = ['listening', 'receiving', 'responding', 'busy', 'stale', 'offline', 'unknown'];
for (const st of requiredStatuses) {
  if (!STATUS_METADATA[st] || !STATUS_METADATA[st].explanation) {
    console.error('FAIL: Missing status metadata for', st);
    process.exit(1);
  }
}
if (!STATUS_METADATA.listening.explanation.includes('Does NOT indicate active model reasoning')) {
  console.error('FAIL: Listening status must explicitly disclaim active model reasoning');
  process.exit(1);
}
console.log('  [PASS] Operating modes & 7 honest participant statuses verified (listening != reasoning)');

// 2. P0.1 Negative Test: Zero synthetic sw_receipt_* or mm_post_* in VERIFIED_RECEIPT_EVENTS
for (const ev of VERIFIED_RECEIPT_EVENTS) {
  if (String(ev.event_id).startsWith('sw_receipt_') || (ev.mm_post_id && String(ev.mm_post_id).startsWith('mm_post_'))) {
    console.error('FAIL: Synthetic receipt or post ID found in VERIFIED_RECEIPT_EVENTS:', ev);
    process.exit(1);
  }
  if (ev.source_verified_link !== false || ev.provenance !== 'CURATED_HISTORICAL_SUMMARY') {
    console.error('FAIL: Historical summary event must have source_verified_link=false and provenance=CURATED_HISTORICAL_SUMMARY:', ev);
    process.exit(1);
  }
}
console.log('  [PASS] P0.1 Negative Check: Zero synthetic sw_receipt_*/mm_post_* IDs; all 9 historical summaries marked source_verified_link=false');

// 3. P0.2 Negative Test: VERIFIED_RECEIPTS mode defaults all seat statuses to UNKNOWN (never online/listening)
const seats = [{ id: 'jay' }, { id: 'buddy' }, { id: 'gem' }, { id: 'finch' }, { id: 'boons' }];
const adapter = new CouncilEventAdapter({ initialMode: OPERATING_MODES.DEMO_SPECIMEN });
adapter.setMode(OPERATING_MODES.VERIFIED_RECEIPTS, seats);
const snap1 = adapter.getSnapshot();
if (snap1.events.length !== 9) {
  console.error('FAIL: Expected 9 historical summary events, got', snap1.events.length);
  process.exit(1);
}
for (const s of seats) {
  if (snap1.seatStatuses[s.id] !== 'unknown') {
    console.error('FAIL: P0.2 violation — seat status in VERIFIED_RECEIPTS mode must be unknown, got:', s.id, snap1.seatStatuses[s.id]);
    process.exit(1);
  }
}
const addedDup = adapter.ingestEvent(VERIFIED_RECEIPT_EVENTS[0]);
if (addedDup !== false || adapter.getEvents().length !== 9) {
  console.error('FAIL: Duplicate event_id was not rejected idempotently');
  process.exit(1);
}
console.log('  [PASS] P0.2 Negative Check: Historical mode sets all seats to UNKNOWN (never false-online/listening) & deduplicates event_ids');

// 4. P0.3 Negative Test: LIVE_READONLY without proxy defaults to disconnected & zero historical events
adapter.setMode(OPERATING_MODES.LIVE_READONLY, seats);
const liveSnap = adapter.getSnapshot();
if (liveSnap.transportState !== 'disconnected' || liveSnap.events.length !== 0 || liveSnap.seatStatuses.gem !== 'offline') {
  console.error('FAIL: P0.3 violation — LIVE_READONLY without proxy must be disconnected with 0 events and offline seats:', liveSnap);
  process.exit(1);
}
console.log('  [PASS] P0.3 Negative Check: LIVE_READONLY defaults to disconnected with 0 historical fixtures rendered as live');

// 5. P0.4 Negative Test: Untrusted ingestEvent cannot self-assign provenance="LIVE_EVENT"
adapter.ingestEvent({
  event_id: 'spoofed_jay_decision_001',
  sender_id: 'jay',
  event_type: 'decision',
  verdict: 'APPROVED',
  provenance: 'LIVE_EVENT',
  source_verified_link: true,
  content: 'Spoofed approval from unauthenticated client call'
});
const spoofedEv = adapter.getEvents().find(e => e.event_id === 'spoofed_jay_decision_001');
if (!spoofedEv || spoofedEv.provenance === 'LIVE_EVENT' || spoofedEv.trusted_host_verified !== false || spoofedEv.source_verified_link !== false) {
  console.error('FAIL: P0.4 violation — Untrusted ingestEvent allowed LIVE_EVENT provenance:', spoofedEv);
  process.exit(1);
}
console.log('  [PASS] P0.4 Negative Check: Untrusted client ingestEvent strips LIVE_EVENT provenance and sets trusted_host_verified=false');

// C1 Negative Check: Placeholder ID (sw_receipt_*, mm_post_*, hist_summary_*) rejected even WITH hostAuthProof
adapter.ingestEvent(
  {
    event_id: 'sw_receipt_allen_mode_a',
    sender_id: 'allen',
    event_type: 'receipt',
    content: 'Attempted placeholder receipt as live event'
  },
  {
    verified_by_host_proxy: true,
    authenticated_principal: 'allen',
    source_msg_id: 'sw_receipt_allen_mode_a'
  }
);
const placeholderIngested = adapter.getEvents().find(e => e.event_id === 'sw_receipt_allen_mode_a');
if (!placeholderIngested || placeholderIngested.provenance === 'LIVE_EVENT' || placeholderIngested.trusted_host_verified !== false) {
  console.error('FAIL: C1 violation — Placeholder identifier sw_receipt_allen_mode_a was accepted as LIVE_EVENT:', placeholderIngested);
  process.exit(1);
}
console.log('  [PASS] C1 Negative Check: Placeholder identifier (sw_receipt_allen_mode_a) rejected from LIVE_EVENT even with hostAuthProof');

// 6. Verify Transport State Transitions (stale, denied, disconnected, error_backoff)
adapter.simulateTransportState('stale', 'Heartbeat > 300s', seats);
if (adapter.getSnapshot().seatStatuses.gem !== 'stale') {
  console.error('FAIL: Expected stale seat status when transport is stale');
  process.exit(1);
}
adapter.simulateTransportState('denied', 'HTTP 401 Unauthorized', seats);
if (adapter.getSnapshot().seatStatuses.gem !== 'offline') {
  console.error('FAIL: Expected offline seat status when transport is denied');
  process.exit(1);
}
adapter.simulateTransportState('error_backoff', 'Network timeout', seats);
if (adapter.getSnapshot().retryCount !== 1) {
  console.error('FAIL: Expected retryCount increment on error_backoff');
  process.exit(1);
}
console.log('  [PASS] Transport state transitions (stale, denied, disconnected, error_backoff) PASS');

// 7. Verify Safe DOM & Markdown Renderer against XSS payloads
function makeMockDoc() {
  function makeNode(tag, text) {
    return {
      tagName: tag,
      textContent: text || '',
      className: '',
      href: '',
      target: '',
      rel: '',
      children: [],
      get firstChild() { return this.children[0] || null; },
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter(x => x !== c); }
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

const container = makeMockDoc();
const malicious = '<script>window.__xss=1</script><img src=x onerror="alert(1)"> **BoldText** `code_snippet` [Council receipt: test-01] [Safe](https://github.com/Ranger-Jay) [Evil](javascript:alert(1))';
renderSafeMessageContent(container, malicious);

function collectTags(node, acc = []) {
  if (node.tagName !== '#text' && node.tagName !== 'DIV') acc.push(node);
  for (const ch of (node.children || [])) collectTags(ch, acc);
  return acc;
}

const tags = collectTags(container);
const tagNames = tags.map(t => t.tagName);
if (tagNames.includes('SCRIPT') || tagNames.includes('IMG')) {
  console.error('FAIL: Unsafe HTML tag was created in DOM:', tagNames);
  process.exit(1);
}
const anchors = tags.filter(t => t.tagName === 'A');
if (anchors.length !== 1 || anchors[0].href !== 'https://github.com/Ranger-Jay' || anchors[0].rel !== 'noopener noreferrer') {
  console.error('FAIL: Safe/unsafe link filtering failed:', anchors);
  process.exit(1);
}
if (isSafeHttpUrl('javascript:alert(1)') || isSafeHttpUrl('data:text/html,hi') || !isSafeHttpUrl('https://github.com/Ranger-Jay')) {
  console.error('FAIL: URL scheme validator failed');
  process.exit(1);
}
console.log('  [PASS] Safe DOM & Markdown renderer blocked <script>, <img onerror>, and javascript: URLs');
console.log('ALL_ADAPTER_TESTS_PASS');
'''

res = subprocess.run(["node", "-e", node_script, ADAPTER_JS], capture_output=True, text=True, encoding="utf-8")
print(res.stdout.strip())
if res.returncode != 0 or "ALL_ADAPTER_TESTS_PASS" not in res.stdout:
    print("FAIL:", res.stderr)
    sys.exit(1)

print("\nOVERALL: ALL EVENT ADAPTER & SAFE RENDERING GATES PASSED! (0 errors)")
