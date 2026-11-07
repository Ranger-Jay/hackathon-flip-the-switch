/**
 * Switch Council Chamber — Event Adapter, Honest Status Model & Safe Renderer
 * (Feature Slice 3: Event-Backed Chamber & Truthful State Machine)
 *
 * Guarantees:
 * 1. Explicit Operating Modes: DEMO_SPECIMEN, VERIFIED_RECEIPTS, LIVE_READONLY.
 * 2. Honest 7-State Participant Status: listening, receiving, responding, busy, stale, offline, unknown.
 *    Never infers active model reasoning from a listener/SSE connection.
 * 3. Safe DOM & Narrowly-Scoped Sanitized Markdown Renderer:
 *    Zero untrusted innerHTML sinks; immune to XSS (<script>, onerror, javascript: URIs).
 * 4. Idempotent Deduplication & Read-Only Transport:
 *    Retries and mode switches never duplicate messages, auto-post, or wake agents.
 */
(function (root) {
  "use strict";

  var OPERATING_MODES = {
    DEMO_SPECIMEN: "DEMO_SPECIMEN",
    VERIFIED_RECEIPTS: "VERIFIED_RECEIPTS",
    LIVE_READONLY: "LIVE_READONLY"
  };

  var HONEST_STATUS = {
    LISTENING: "listening",
    RECEIVING: "receiving",
    RESPONDING: "responding",
    BUSY: "busy",
    STALE: "stale",
    OFFLINE: "offline",
    UNKNOWN: "unknown"
  };

  var STATUS_METADATA = {
    listening: {
      label: "LISTENING (IDLE)",
      shortLabel: "Listening",
      cssClass: "status-listening",
      explanation: "Listener / session connected and idle. Does NOT indicate active model reasoning."
    },
    receiving: {
      label: "RECEIVING TURN",
      shortLabel: "Receiving",
      cssClass: "status-receiving",
      explanation: "Addressed event delivered; awaiting auto-receipt or turn execution."
    },
    responding: {
      label: "RESPONDING (ACTIVE TURN)",
      shortLabel: "Responding",
      cssClass: "status-responding",
      explanation: "Actively generating or delivering an in-role Council response."
    },
    busy: {
      label: "BUSY (TOOL / CHECK)",
      shortLabel: "Busy",
      cssClass: "status-busy",
      explanation: "Executing local verification check or bounded tool operation."
    },
    stale: {
      label: "STALE HEARTBEAT",
      shortLabel: "Stale",
      cssClass: "status-stale",
      explanation: "Last verified heartbeat or receipt exceeded freshness window."
    },
    offline: {
      label: "OFFLINE",
      shortLabel: "Offline",
      cssClass: "status-offline",
      explanation: "No active listener or session connected."
    },
    unknown: {
      label: "UNKNOWN",
      shortLabel: "Unknown",
      cssClass: "status-unknown",
      explanation: "Status not verified in current view mode."
    }
  };

  /**
   * Verified 8/8 Seat-Steering & Coexistence Receipts (Recorded Nov 5-6, 2026)
   * Public-safe representation; private installation config can override IDs at runtime.
   */
  var VERIFIED_RECEIPT_EVENTS = [
    {
      event_id: "sw_receipt_allen_mode_a",
      mm_post_id: "mm_post_allen_01",
      thread_id: null,
      correlation_id: "seat-steer-oneseat-v001.00",
      sender_id: "allen",
      sender_name: "allen",
      prefix: "Allen (Engineering Squad Lead):",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      event_type: "receipt_proof",
      content: "OWN-PROVE-allen-20261105-162512 principal=Allen own-runtime Mode-A — Verified seat-bound post and room history read-back (`own_seat=true`).",
      timestamp: 1793913912000,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_cora_mode_a",
      mm_post_id: "mm_post_cora_01",
      thread_id: null,
      correlation_id: "seat-steer-oneseat-v001.00",
      sender_id: "cora",
      sender_name: "cora",
      prefix: "Cora (Operations Lead & Commander):",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      event_type: "receipt_proof",
      content: "OWN-PROVE-cora-20261105-162607 principal=Cora own-runtime Mode-A — Verified seat-bound post and room history read-back (`own_seat=true`).",
      timestamp: 1793913967000,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_charlie_mode_a",
      mm_post_id: "mm_post_charlie_01",
      thread_id: null,
      correlation_id: "seat-steer-oneseat-v001.00",
      sender_id: "charlie",
      sender_name: "charlie",
      prefix: "Charlie (Creatives & Product Lead):",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      event_type: "receipt_proof",
      content: "OWN-PROVE-charlie-20261105-164326 principal=Charlie own-runtime Mode-A — Verified one-seat helper acceptance and history read-back (`own_seat=true`).",
      timestamp: 1793915006000,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_bucky_mode_a",
      mm_post_id: "mm_post_bucky_01",
      thread_id: null,
      correlation_id: "seat-steer-oneseat-v001.00",
      sender_id: "bucky",
      sender_name: "bucky",
      prefix: "Bucky (Intelligence & Evidence Auditor):",
      runtime_label: "One-Seat Helper (Mode A)",
      execution_mode: "mode_a_oneseat_helper",
      event_type: "receipt_proof",
      content: "OWN-PROVE-bucky-20261105-164414 principal=Bucky own-runtime Mode-A — Continuity audit confirmed in Council room history (`own_seat=true`).",
      timestamp: 1793915054000,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_gem_pattern_b",
      mm_post_id: "mm_post_gem_01",
      thread_id: null,
      correlation_id: "seat-steer-pattern-b",
      sender_id: "gem",
      sender_name: "gem",
      prefix: "Gem (Creative & UX Lead):",
      runtime_label: "Native Antigravity Host",
      execution_mode: "native_acp_host",
      event_type: "receipt_proof",
      content: "OWN-PROVE-gem-20261105-164728 principal=Gem own-runtime Pattern-B — Native Antigravity session post and history read-back confirmed (`own_seat=true`, 151.2ms).",
      timestamp: 1793915248945,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_boons_mode_a",
      mm_post_id: "mm_post_boons_01",
      thread_id: null,
      correlation_id: "seat-steer-oneseat-v001.00",
      sender_id: "boons",
      sender_name: "boons",
      prefix: "Boons (Bridge & Integration Lead):",
      runtime_label: "Custom Bridge / One-Seat Helper",
      execution_mode: "mode_a_oneseat_helper",
      event_type: "receipt_proof",
      content: "OWN-PROVE-boons-20261105-171733 principal=Boons own-runtime Mode-A — Custom bridge principal verified in room history (`own_seat=true`).",
      timestamp: 1793917053000,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_buddy_direct_mcp",
      mm_post_id: "mm_post_buddy_01",
      thread_id: null,
      correlation_id: "buddy-reconnect-smoke-20261106-2130-01",
      sender_id: "buddy",
      sender_name: "buddy",
      prefix: "Buddy Main (Original ChatGPT Orchestrator):",
      runtime_label: "Direct-Seat Council MCP (OAuth S256)",
      execution_mode: "direct_seat_mcp",
      event_type: "receipt_proof",
      content: "[Buddy Main via Council MCP] Direct-seat write/read verified from original ChatGPT conversation (`own_seat=true`). [Council receipt: buddy-reconnect-smoke-20261106-2130-01]",
      timestamp: 1794020996647,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_jay_welcome",
      mm_post_id: "mm_post_jay_01",
      thread_id: null,
      correlation_id: "human-room-check",
      sender_id: "jay",
      sender_name: "jay",
      prefix: "Jay (Human Lead & Authorizer):",
      runtime_label: "Human Operator (Mattermost / Switch)",
      execution_mode: "human_operator",
      event_type: "system_notice",
      content: "Welcome back buddy! — Human operator room verification in canonical Council channel (`switch/council`). Live Funding Intelligence proposal and final decision gate remain reserved for Jay's live action.",
      timestamp: 1794021052947,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    },
    {
      event_id: "sw_receipt_finch_direct_mcp",
      mm_post_id: "mm_post_finch_01",
      thread_id: null,
      correlation_id: "finch-hello-world-2026-11-06-01",
      sender_id: "finch",
      sender_name: "finch",
      prefix: "Finch (Original Codex Runtime):",
      runtime_label: "Direct-Seat Council MCP (OAuth S256)",
      execution_mode: "direct_seat_mcp",
      event_type: "receipt_proof",
      content: "[Finch via Council MCP] Direct-seat post and independent read-back verified (`own_seat=true`). Coexistence confirmed: Finch and Buddy Main retain isolated OAuth subjects without evicting each other. [Council receipt: finch-hello-world-2026-11-06-01]",
      timestamp: 1794021120000,
      own_seat: true,
      provenance: "VERIFIED_RECEIPT"
    }
  ];

  /**
   * Safe inline tokenizer & DOM builder.
   * Never uses innerHTML with dynamic text. Supports:
   * - **bold**
   * - `inline code`
   * - [Council receipt: ...] badges
   * - [label](https://...) safe external links (strictly https:// or http://localhost)
   */
  function renderSafeMessageContent(container, rawText) {
    if (!container) return;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    var text = String(rawText == null ? "" : rawText);
    var doc = container.ownerDocument || document;

    // Split by paragraphs / newlines
    var lines = text.split(/\r?\n/);
    lines.forEach(function (line, lineIdx) {
      if (lineIdx > 0) {
        container.appendChild(doc.createElement("br"));
      }
      appendSafeInlineTokens(doc, container, line);
    });
  }

  function isSafeHttpUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    var trimmed = urlStr.trim();
    if (/^https:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+$/.test(trimmed)) {
      return true;
    }
    return false;
  }

  function appendSafeInlineTokens(doc, parent, line) {
    // Match `code`, **bold**, [Council receipt: ...], or [text](url)
    var tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[Council receipt:[^\]]+\]|\[[^\]]+\]\([^)]+\))/g;
    var lastIndex = 0;
    var match;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(doc.createTextNode(line.slice(lastIndex, match.index)));
      }
      var token = match[0];
      if (token.charAt(0) === "`" && token.charAt(token.length - 1) === "`") {
        var codeEl = doc.createElement("code");
        codeEl.className = "msg-inline-code";
        codeEl.textContent = token.slice(1, -1);
        parent.appendChild(codeEl);
      } else if (token.slice(0, 2) === "**" && token.slice(-2) === "**") {
        var strongEl = doc.createElement("strong");
        strongEl.textContent = token.slice(2, -2);
        parent.appendChild(strongEl);
      } else if (token.indexOf("[Council receipt:") === 0) {
        var badgeEl = doc.createElement("span");
        badgeEl.className = "citation-pill receipt-pill";
        badgeEl.textContent = token;
        parent.appendChild(badgeEl);
      } else if (token.charAt(0) === "[") {
        var linkParts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
        if (linkParts && isSafeHttpUrl(linkParts[2])) {
          var aEl = doc.createElement("a");
          aEl.className = "msg-safe-link";
          aEl.href = linkParts[2].trim();
          aEl.target = "_blank";
          aEl.rel = "noopener noreferrer";
          aEl.textContent = linkParts[1];
          parent.appendChild(aEl);
        } else {
          // Unsafe scheme (e.g. javascript:) -> render as harmless literal text
          parent.appendChild(doc.createTextNode(token));
        }
      } else {
        parent.appendChild(doc.createTextNode(token));
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parent.appendChild(doc.createTextNode(line.slice(lastIndex)));
    }
  }

  /**
   * CouncilEventAdapter manages mode state, deduplicated event ledger, honest seat statuses,
   * and read-only transport state (loading, connected, syncing, stale, denied, disconnected, error_backoff).
   */
  function CouncilEventAdapter(options) {
    options = options || {};
    this.mode = options.initialMode || OPERATING_MODES.DEMO_SPECIMEN;
    this.transportState = "idle";
    this.lastError = null;
    this.retryCount = 0;
    this.eventsById = {};
    this.eventOrder = [];
    this.seatStatuses = {};
    this.listeners = [];
    this.livePollTimer = null;
    this.staleThresholdMs = options.staleThresholdMs || 300000;
    this.liveEndpointUrl = options.liveEndpointUrl || null;
  }

  CouncilEventAdapter.prototype.subscribe = function (listener) {
    if (typeof listener === "function") {
      this.listeners.push(listener);
    }
    var self = this;
    return function unsubscribe() {
      self.listeners = self.listeners.filter(function (fn) { return fn !== listener; });
    };
  };

  CouncilEventAdapter.prototype.notify = function () {
    var snapshot = this.getSnapshot();
    this.listeners.forEach(function (fn) {
      try { fn(snapshot); } catch (e) { /* ignore listener error */ }
    });
  };

  CouncilEventAdapter.prototype.clearEvents = function () {
    this.eventsById = {};
    this.eventOrder = [];
  };

  /**
   * Idempotent event insertion: returns true if added, false if duplicate event_id.
   */
  CouncilEventAdapter.prototype.ingestEvent = function (rawEvent) {
    if (!rawEvent || !rawEvent.event_id) return false;
    var id = String(rawEvent.event_id);
    if (Object.prototype.hasOwnProperty.call(this.eventsById, id)) {
      return false;
    }
    var normalized = {
      event_id: id,
      mm_post_id: rawEvent.mm_post_id || null,
      thread_id: rawEvent.thread_id || null,
      correlation_id: rawEvent.correlation_id || null,
      sender_id: rawEvent.sender_id || "unknown",
      sender_name: rawEvent.sender_name || rawEvent.sender_id || "unknown",
      prefix: rawEvent.prefix || (rawEvent.sender_name ? rawEvent.sender_name + ":" : "Agent:"),
      runtime_label: rawEvent.runtime_label || "Switch Seat",
      execution_mode: rawEvent.execution_mode || "demo_fixture",
      event_type: rawEvent.event_type || "assessment",
      content: String(rawEvent.content || ""),
      timestamp: Number(rawEvent.timestamp) || Date.now(),
      own_seat: typeof rawEvent.own_seat === "boolean" ? rawEvent.own_seat : null,
      provenance: rawEvent.provenance || (this.mode === OPERATING_MODES.DEMO_SPECIMEN ? "DEMO_FIXTURE" : "VERIFIED_RECEIPT")
    };
    this.eventsById[id] = normalized;
    this.eventOrder.push(id);
    return true;
  };

  CouncilEventAdapter.prototype.setSeatStatus = function (seatId, statusKey) {
    if (!STATUS_METADATA[statusKey]) {
      statusKey = HONEST_STATUS.UNKNOWN;
    }
    this.seatStatuses[seatId] = statusKey;
    this.notify();
  };

  CouncilEventAdapter.prototype.computeDefaultSeatStatuses = function (seats, mode, transportState) {
    var map = {};
    var self = this;
    (seats || []).forEach(function (s) {
      if (mode === OPERATING_MODES.DEMO_SPECIMEN) {
        map[s.id] = s.defaultStatus || HONEST_STATUS.LISTENING;
      } else if (mode === OPERATING_MODES.VERIFIED_RECEIPTS) {
        map[s.id] = HONEST_STATUS.LISTENING;
      } else if (mode === OPERATING_MODES.LIVE_READONLY) {
        if (transportState === "connected" || transportState === "syncing") {
          map[s.id] = HONEST_STATUS.LISTENING;
        } else if (transportState === "stale") {
          map[s.id] = HONEST_STATUS.STALE;
        } else if (transportState === "disconnected" || transportState === "denied" || transportState === "error_backoff") {
          map[s.id] = HONEST_STATUS.OFFLINE;
        } else {
          map[s.id] = HONEST_STATUS.UNKNOWN;
        }
      } else {
        map[s.id] = HONEST_STATUS.UNKNOWN;
      }
      self.seatStatuses[s.id] = map[s.id];
    });
    return map;
  };

  CouncilEventAdapter.prototype.setMode = function (newMode, seats) {
    if (!OPERATING_MODES[newMode]) {
      newMode = OPERATING_MODES.DEMO_SPECIMEN;
    }
    this.mode = newMode;
    this.lastError = null;
    this.clearEvents();

    if (newMode === OPERATING_MODES.DEMO_SPECIMEN) {
      this.transportState = "specimen_ready";
      this.computeDefaultSeatStatuses(seats, newMode, this.transportState);
    } else if (newMode === OPERATING_MODES.VERIFIED_RECEIPTS) {
      this.transportState = "verified_ledger";
      this.computeDefaultSeatStatuses(seats, newMode, this.transportState);
      var self = this;
      VERIFIED_RECEIPT_EVENTS.forEach(function (ev) {
        self.ingestEvent(ev);
      });
    } else if (newMode === OPERATING_MODES.LIVE_READONLY) {
      this.transportState = this.liveEndpointUrl ? "connecting" : "disconnected";
      if (!this.liveEndpointUrl) {
        this.lastError = "No read-only proxy endpoint configured in browser settings. Using verified receipts or configure proxy endpoint.";
      }
      this.computeDefaultSeatStatuses(seats, newMode, this.transportState);
    }
    this.notify();
  };

  CouncilEventAdapter.prototype.simulateTransportState = function (stateName, errorMsg, seats) {
    this.transportState = stateName;
    this.lastError = errorMsg || null;
    if (stateName === "error_backoff") {
      this.retryCount += 1;
    }
    this.computeDefaultSeatStatuses(seats, this.mode, this.transportState);
    this.notify();
  };

  CouncilEventAdapter.prototype.getEvents = function () {
    var self = this;
    return this.eventOrder.map(function (id) { return self.eventsById[id]; });
  };

  CouncilEventAdapter.prototype.getSnapshot = function () {
    return {
      mode: this.mode,
      transportState: this.transportState,
      lastError: this.lastError,
      retryCount: this.retryCount,
      events: this.getEvents(),
      seatStatuses: Object.assign({}, this.seatStatuses)
    };
  };

  var exported = {
    OPERATING_MODES: OPERATING_MODES,
    HONEST_STATUS: HONEST_STATUS,
    STATUS_METADATA: STATUS_METADATA,
    VERIFIED_RECEIPT_EVENTS: VERIFIED_RECEIPT_EVENTS,
    CouncilEventAdapter: CouncilEventAdapter,
    renderSafeMessageContent: renderSafeMessageContent,
    isSafeHttpUrl: isSafeHttpUrl
  };

  if (typeof window !== "undefined") {
    window.CouncilEventAdapterModule = exported;
    window.CouncilEventAdapter = CouncilEventAdapter;
    window.renderSafeMessageContent = renderSafeMessageContent;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);
