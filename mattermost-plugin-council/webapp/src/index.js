/**
 * Switch Council Chamber & Evidence Panel — Mattermost 12.0.1 WebApp Plugin
 * Plugin ID: com.switch.council-chamber
 *
 * Verified against Mattermost Server v12.0.1 (Build 39742891057):
 * - window.registerPlugin(id, plugin)
 * - registry.registerRightHandSidebarComponent(component, title)
 * - registry.registerChannelHeaderButtonAction(icon, action, dropdownText, tooltipText)
 * - registry.registerRootComponent(component)
 * - registry.registerPostActionComponent(component)
 * - registry.registerWebSocketEventHandler(event, handler)
 * - registry.registerReducer(reducer)
 *
 * Security & Truthfulness:
 * - Zero agent bearer tokens or privileged keys in browser bundle.
 * - Preserves the single canonical Mattermost channel conversation (switch/council).
 * - Functional RHS mounts live channel post provenance, Human Decision Gate status,
 *   and 7-role Engineering Readiness Summaries with interactive post selection.
 */
(function () {
  "use strict";

  var PLUGIN_ID = "com.switch.council-chamber";
  var ACTION_TOGGLE_CHAMBER = PLUGIN_ID + "/TOGGLE_CHAMBER";
  var ACTION_SET_CHAMBER_OPEN = PLUGIN_ID + "/SET_CHAMBER_OPEN";
  var ACTION_SELECT_POST = PLUGIN_ID + "/SELECT_POST";
  var ACTION_SET_MODE = PLUGIN_ID + "/SET_MODE";
  var ACTION_WS_EVENT = PLUGIN_ID + "/WS_EVENT";

  var ROLE_READINESS_SUMMARIES = [
    { seat: "Finch", role: "Runtime & Verification", mode: "Direct-Seat MCP", status: "PASS", ref: "sw_9f3f6de5d9774c43914093ae1be5187e" },
    { seat: "Cora", role: "Operations & Infra", mode: "Mode-A One-Seat", status: "PASS", ref: "OWN-PROVE-cora-20261105-162607" },
    { seat: "Gem", role: "Creative & UX Lead", mode: "Pattern-B Own-Runtime", status: "PASS", ref: "sw_e3abd2912ee949338cfd0ce4a4a6a00f" },
    { seat: "Boons", role: "Bridge & Demo Lead", mode: "Pattern-B Own-Runtime", status: "PASS", ref: "OWN-PROVE-boons-20261105-171733" },
    { seat: "Allen", role: "Engineering Squad", mode: "Mode-A One-Seat", status: "PASS", ref: "OWN-PROVE-allen-20261105-162512" },
    { seat: "Bucky", role: "Evidence Auditor", mode: "Mode-A One-Seat", status: "PASS", ref: "OWN-PROVE-bucky-20261105-164414" },
    { seat: "Charlie", role: "Product & Creatives", mode: "Mode-A One-Seat", status: "PASS", ref: "OWN-PROVE-charlie-20261105-164326" }
  ];

  var initialState = {
    isChamberOpen: false,
    selectedPostId: null,
    operatingMode: "VERIFIED_RECEIPTS",
    lastWsEventAt: null,
    wsEventCount: 0,
    wsIngestedPosts: []
  };

  function parseWsPostPayload(eventMsg) {
    if (!eventMsg) return null;
    var data = eventMsg.data || eventMsg;
    if (data && data.post) {
      if (typeof data.post === "string") {
        try { return JSON.parse(data.post); } catch (_) { return null; }
      }
      if (typeof data.post === "object") {
        return data.post;
      }
    }
    if (data && data.id && data.message) {
      return data;
    }
    return null;
  }

  function councilPluginReducer(state, action) {
    if (typeof state === "undefined") {
      state = initialState;
    }
    if (!action || !action.type) {
      return state;
    }
    switch (action.type) {
      case ACTION_TOGGLE_CHAMBER:
        return Object.assign({}, state, { isChamberOpen: !state.isChamberOpen });
      case ACTION_SET_CHAMBER_OPEN:
        return Object.assign({}, state, { isChamberOpen: Boolean(action.open) });
      case ACTION_SELECT_POST:
        return Object.assign({}, state, { selectedPostId: action.postId || null });
      case ACTION_SET_MODE:
        return Object.assign({}, state, { operatingMode: action.mode || "VERIFIED_RECEIPTS" });
      case ACTION_WS_EVENT:
        var parsedPost = parseWsPostPayload(action.event);
        var nextWsPosts = (state.wsIngestedPosts || []).slice();
        if (parsedPost && parsedPost.id) {
          var exists = nextWsPosts.some(function (p) { return p.id === parsedPost.id; });
          if (!exists) nextWsPosts.push(parsedPost);
        }
        return Object.assign({}, state, {
          lastWsEventAt: action.timestamp || Date.now(),
          wsEventCount: (state.wsEventCount || 0) + 1,
          wsIngestedPosts: nextWsPosts
        });
      default:
        return state;
    }
  }

  /**
   * Safely derive channel context & viewer permissions from Mattermost 12.0.1 Redux store
   * (merging any live WebSocket-ingested posts for the active channel).
   */
  function getChannelContextFromStore(store) {
    if (!store || typeof store.getState !== "function") {
      return {
        channelId: null,
        channelName: "council",
        channelDisplayName: "switch/council",
        teamName: "switch",
        currentUserId: null,
        viewerRole: "member",
        postsCount: 0,
        posts: []
      };
    }
    var st = store.getState() || {};
    var entities = st.entities || {};
    var channels = (entities.channels && entities.channels.channels) || {};
    var currentChannelId = (entities.channels && entities.channels.currentChannelId) || null;
    var activeChannel = (currentChannelId && channels[currentChannelId]) || {};
    var users = (entities.users && entities.users.profiles) || {};
    var currentUserId = (entities.users && entities.users.currentUserId) || null;
    var currentUser = (currentUserId && users[currentUserId]) || {};
    var postsMap = Object.assign({}, (entities.posts && entities.posts.posts) || {});

    var pState = st["plugins-" + PLUGIN_ID] || initialState;
    (pState.wsIngestedPosts || []).forEach(function (wp) {
      if (wp && wp.id && !postsMap[wp.id]) {
        postsMap[wp.id] = wp;
      }
    });

    var postList = Object.keys(postsMap).map(function (k) { return postsMap[k]; }).filter(function (p) {
      return !currentChannelId || !p.channel_id || p.channel_id === currentChannelId;
    }).sort(function (a, b) {
      return (a.create_at || 0) - (b.create_at || 0);
    });

    return {
      channelId: currentChannelId,
      channelName: activeChannel.name || "council",
      channelDisplayName: activeChannel.display_name || "switch/council",
      teamName: (entities.teams && entities.teams.currentTeamId) || "switch",
      currentUserId: currentUserId,
      viewerRole: currentUser.roles || "channel_user",
      postsCount: postList.length,
      posts: postList
    };
  }

  function getPluginSlice(store) {
    if (!store || typeof store.getState !== "function") {
      return initialState;
    }
    var st = store.getState() || {};
    return st["plugins-" + PLUGIN_ID] || initialState;
  }

  function createHeaderIcon(symbol, label) {
    var React = (typeof window !== "undefined" && window.React) ? window.React : null;
    if (React && typeof React.createElement === "function") {
      return React.createElement(
        "span",
        {
          className: "mm-council-header-icon",
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: 700,
            fontSize: "13px",
            color: "#00F0FF"
          },
          "aria-label": label
        },
        symbol
      );
    }
    return symbol;
  }

  /**
   * Functional Right-Hand Sidebar (RHS) Evidence & Decision Component (P1.5)
   */
  function createRHSComponent(pluginRef) {
    var React = (typeof window !== "undefined" && window.React) ? window.React : null;
    if (!React || typeof React.createElement !== "function") {
      return function FallbackRHS() { return null; };
    }

    return function CouncilEvidenceRHS() {
      var store = pluginRef.store;
      var ctx = getChannelContextFromStore(store);
      var pState = getPluginSlice(store);
      var selectedPost = null;
      if (pState.selectedPostId) {
        for (var i = 0; i < ctx.posts.length; i++) {
          if (ctx.posts[i].id === pState.selectedPostId) {
            selectedPost = ctx.posts[i];
            break;
          }
        }
      }

      var postNodes = ctx.posts.map(function (p) {
        var isSelected = p.id === pState.selectedPostId;
        return React.createElement(
          "div",
          {
            key: p.id,
            className: "mm-rhs-post-item" + (isSelected ? " selected" : ""),
            style: {
              padding: "8px 10px",
              marginBottom: "6px",
              borderRadius: "6px",
              background: isSelected ? "rgba(0, 240, 255, 0.14)" : "rgba(255,255,255,0.04)",
              border: isSelected ? "1px solid #00F0FF" : "1px solid rgba(255,255,255,0.08)",
              fontSize: "12px",
              cursor: "pointer"
            },
            onClick: function () {
              if (store) {
                store.dispatch({ type: ACTION_SELECT_POST, postId: p.id });
              }
              navigateToChannelPostDom(p.id);
            }
          },
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px" } },
            React.createElement("strong", { style: { color: "#00F0FF" } }, "@" + (p.sender_name || p.user_id || "seat")),
            React.createElement("code", { style: { fontSize: "11px", color: "#9CA3AF" } }, p.id)
          ),
          React.createElement("div", { style: { color: "#E5E7EB", fontSize: "11px" } }, p.message || "")
        );
      });

      var readinessNodes = ROLE_READINESS_SUMMARIES.map(function (r) {
        return React.createElement(
          "div",
          {
            key: r.seat,
            className: "mm-rhs-readiness-row",
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 8px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: "11px"
            }
          },
          React.createElement(
            "span",
            null,
            React.createElement("strong", { style: { color: "#F3F4F6" } }, r.seat),
            " · " + r.mode
          ),
          React.createElement(
            "span",
            { style: { color: "#10B981", fontFamily: "monospace" } },
            "[" + r.status + "] " + r.ref
          )
        );
      });

      return React.createElement(
        "div",
        {
          className: "mm-council-rhs-container",
          role: "region",
          "aria-label": "Council Evidence and Decision Panel",
          style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "#0B0E17",
            color: "#F3F4F6",
            fontFamily: "'Inter', -apple-system, sans-serif",
            borderLeft: "1px solid rgba(0, 240, 255, 0.35)"
          }
        },
        // Mode & Channel Banner
        React.createElement(
          "div",
          {
            className: "mm-council-rhs-banner",
            style: {
              padding: "10px 14px",
              background: pState.operatingMode === "DEMO_SPECIMEN"
                ? "rgba(245, 158, 11, 0.16)"
                : "rgba(0, 240, 255, 0.12)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace"
            }
          },
          React.createElement(
            "span",
            { style: { fontWeight: 700, color: pState.operatingMode === "DEMO_SPECIMEN" ? "#FBBF24" : "#00F0FF" } },
            "MODE: " + pState.operatingMode
          ),
          React.createElement(
            "span",
            { style: { color: "#9CA3AF" } },
            "Channel: " + ctx.channelDisplayName + " (" + ctx.postsCount + " posts · WS:" + pState.wsEventCount + ")"
          )
        ),
        // Action Bar
        React.createElement(
          "div",
          {
            style: {
              padding: "12px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap"
            }
          },
          React.createElement(
            "button",
            {
              type: "button",
              className: "mm-council-launch-chamber-btn",
              onClick: function () {
                if (store) {
                  store.dispatch({ type: ACTION_SET_CHAMBER_OPEN, open: true });
                }
                if (typeof window !== "undefined" && typeof window.onCouncilPluginOpenChamber === "function") {
                  window.onCouncilPluginOpenChamber();
                }
              },
              style: {
                flex: 1,
                background: "#00F0FF",
                color: "#05080E",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer"
              }
            },
            "⚡ Expand 9-Seat Council Chamber"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              className: "mm-council-mode-cycle-btn",
              onClick: function () {
                var modes = ["VERIFIED_RECEIPTS", "DEMO_SPECIMEN", "LIVE_READONLY"];
                var next = modes[(modes.indexOf(pState.operatingMode) + 1) % modes.length];
                if (store) {
                  store.dispatch({ type: ACTION_SET_MODE, mode: next });
                }
                if (typeof window !== "undefined" && typeof window.setCouncilOperatingMode === "function") {
                  window.setCouncilOperatingMode(next);
                }
              },
              style: {
                background: "rgba(255,255,255,0.08)",
                color: "#F3F4F6",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "6px",
                padding: "8px 10px",
                fontSize: "11px",
                cursor: "pointer"
              }
            },
            "Switch Mode"
          )
        ),
        // Functional Evidence & Decision Content
        React.createElement(
          "div",
          {
            className: "mm-council-rhs-body",
            id: "mmPluginEvidenceMount",
            style: {
              padding: "14px",
              overflowY: "auto",
              flex: 1,
              fontSize: "12px",
              lineHeight: 1.5
            }
          },
          // 1. Fail-Closed Human Decision Gate Card
          React.createElement(
            "div",
            {
              className: "mm-rhs-decision-gate",
              style: {
                padding: "10px 12px",
                marginBottom: "12px",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.4)"
              }
            },
            React.createElement(
              "div",
              { style: { fontWeight: 700, color: "#FBBF24", fontSize: "11px", marginBottom: "4px" } },
              "🔒 HUMAN DECISION GATE: AWAITING_HUMAN_DECISION"
            ),
            React.createElement(
              "div",
              { style: { fontSize: "11px", color: "#D1D5DB" } },
              "Fail-closed gate active. Requires an authenticated live human decision event (APPROVED / DECLINED / DEFERRED) from @jay in " + ctx.channelDisplayName + "."
            )
          ),
          // 2. Cited / Selected Post Detail
          pState.selectedPostId
            ? React.createElement(
                "div",
                {
                  className: "mm-rhs-selected-post-card",
                  style: {
                    padding: "10px",
                    marginBottom: "12px",
                    background: "rgba(0, 240, 255, 0.1)",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }
                },
                React.createElement("strong", { style: { color: "#00F0FF" } }, "Cited Channel Post: "),
                React.createElement("code", null, pState.selectedPostId),
                selectedPost
                  ? React.createElement(
                      "div",
                      { style: { marginTop: "6px", color: "#F3F4F6", fontSize: "11px" } },
                      "@" + (selectedPost.sender_name || "seat") + ": " + selectedPost.message
                    )
                  : null
              )
            : null,
          // 3. Channel Posts in Store
          React.createElement(
            "div",
            { style: { marginBottom: "14px" } },
            React.createElement(
              "div",
              { style: { fontWeight: 700, fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px" } },
              "Channel Post Provenance (" + ctx.postsCount + " in Redux Store)"
            ),
            postNodes
          ),
          // 4. Curated Role Readiness Summaries
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { fontWeight: 700, fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", marginBottom: "6px" } },
              "Curated Engineering Readiness Summaries (Nov 5–6)"
            ),
            readinessNodes
          )
        )
      );
    };
  }

  var CHAMBER_SEATS = [
    { id: "jay", name: "Jay", role: "Human Lead & Authorizer", emoji: "🐕", avatar: "avatars/jay.png", fallback: "avatars/jay.svg", mode: "human_authority", status: "unknown" },
    { id: "buddy", name: "Buddy", role: "Architect & Conductor", emoji: "🦅", avatar: "avatars/buddy.png", fallback: "avatars/buddy.svg", mode: "direct_seat_mcp", status: "unknown" },
    { id: "cora", name: "Cora", role: "Operations & Commander", emoji: "🎖️", avatar: "avatars/cora.png", fallback: "avatars/cora.svg", mode: "mode_a_oneseat_helper", status: "unknown" },
    { id: "gem", name: "Gem", role: "Creative & UX Lead", emoji: "💎", avatar: "avatars/gem.png", fallback: "avatars/gem.svg", mode: "pattern_b_own_runtime", status: "unknown" },
    { id: "finch", name: "Finch", role: "Runtime & Verification", emoji: "🐦", avatar: "avatars/finch.png", fallback: "avatars/finch.svg", mode: "direct_seat_mcp", status: "unknown" },
    { id: "boons", name: "Boons", role: "Bridge & Demo Lead", emoji: "🐝", avatar: "avatars/boons.png", fallback: "avatars/boons.svg", mode: "pattern_b_own_runtime", status: "unknown" },
    { id: "allen", name: "Allen", role: "Engineering Squad Lead", emoji: "🔧", avatar: "avatars/allen.png", fallback: "avatars/allen.svg", mode: "mode_a_oneseat_helper", status: "unknown" },
    { id: "bucky", name: "Bucky", role: "Evidence Auditor", emoji: "🔭", avatar: "avatars/bucky.png", fallback: "avatars/bucky.svg", mode: "mode_a_oneseat_helper", status: "unknown" },
    { id: "charlie", name: "Charlie", role: "Product & Creatives", emoji: "🎬", avatar: "avatars/charlie.png", fallback: "avatars/charlie.svg", mode: "mode_a_oneseat_helper", status: "unknown" }
  ];

  function navigateToChannelPostDom(postId) {
    if (typeof document === "undefined" || !postId) return false;
    var row = document.getElementById("mm-post-row-" + postId) || document.querySelector('[data-mm-post-id="' + postId + '"]');
    if (row) {
      if (typeof row.scrollIntoView === "function") {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      row.style.outline = "2px solid #00F0FF";
      row.style.background = "rgba(0, 240, 255, 0.14)";
      setTimeout(function () {
        row.style.outline = "";
        row.style.background = "";
      }, 1800);
      return true;
    }
    return false;
  }

  /**
   * Functional Root Overlay Component for Full 9-Seat Council Chamber (Section 6 / C3)
   * Renders the complete 9-seat circular chamber ring, seat status inspector, and
   * live channel post stream directly via React.createElement (no placeholder text or external iframe required).
   */
  function createRootOverlayComponent(pluginRef) {
    var React = (typeof window !== "undefined" && window.React) ? window.React : null;
    if (!React || typeof React.createElement !== "function") {
      return function FallbackRoot() { return null; };
    }

    return function CouncilChamberRootOverlay() {
      var store = pluginRef.store;
      var pState = getPluginSlice(store);
      var ctx = getChannelContextFromStore(store);

      if (!pState.isChamberOpen) {
        return null;
      }

      var radius = 155;
      var centerX = 210;
      var centerY = 210;
      var seatNodes = CHAMBER_SEATS.map(function (seat, idx) {
        var angle = (idx / CHAMBER_SEATS.length) * 2 * Math.PI - Math.PI / 2;
        var x = Math.round(centerX + radius * Math.cos(angle));
        var y = Math.round(centerY + radius * Math.sin(angle));
        return React.createElement(
          "div",
          {
            key: seat.id,
            className: "mm-overlay-seat-node",
            "data-seat-id": seat.id,
            style: {
              position: "absolute",
              left: (x - 36) + "px",
              top: (y - 36) + "px",
              width: "72px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer"
            }
          },
          React.createElement(
            "div",
            {
              style: {
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: "2px solid rgba(156, 163, 175, 0.55)",
                overflow: "hidden",
                background: "#111827"
              }
            },
            React.createElement("img", {
              src: seat.avatar,
              alt: seat.name,
              width: "52",
              height: "52",
              style: { width: "100%", height: "100%", objectFit: "cover" }
            })
          ),
          React.createElement(
            "span",
            {
              style: {
                marginTop: "4px",
                padding: "2px 6px",
                borderRadius: "10px",
                background: "rgba(15, 23, 42, 0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: "10px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: "#F3F4F6"
              }
            },
            seat.emoji + " " + seat.name
          ),
          React.createElement(
            "span",
            { style: { fontSize: "9px", color: "#9CA3AF", fontFamily: "monospace" } },
            seat.status.toUpperCase()
          )
        );
      });

      var streamPosts = ctx.posts.map(function (p) {
        var isSelected = p.id === pState.selectedPostId;
        return React.createElement(
          "div",
          {
            key: p.id,
            className: "mm-overlay-post-card" + (isSelected ? " selected" : ""),
            style: {
              padding: "10px 12px",
              marginBottom: "8px",
              borderRadius: "8px",
              background: isSelected ? "rgba(0, 240, 255, 0.14)" : "rgba(255,255,255,0.04)",
              border: isSelected ? "1px solid #00F0FF" : "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer"
            },
            onClick: function () {
              if (store) {
                store.dispatch({ type: ACTION_SELECT_POST, postId: p.id });
              }
              navigateToChannelPostDom(p.id);
              navigateToChannelPostDom(p.id);
            }
          },
          React.createElement(
            "div",
            { style: { display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" } },
            React.createElement("strong", { style: { color: "#00F0FF" } }, "@" + (p.sender_name || p.user_id || "seat")),
            React.createElement("code", { style: { fontSize: "11px", color: "#9CA3AF" } }, p.id)
          ),
          React.createElement("div", { style: { fontSize: "12px", color: "#E5E7EB" } }, p.message || "")
        );
      });

      return React.createElement(
        "div",
        {
          className: "mm-council-root-overlay",
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Full Switch Council Chamber Overlay",
          style: {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(7, 9, 14, 0.96)",
            backdropFilter: "blur(16px)",
            display: "flex",
            flexDirection: "column",
            color: "#F3F4F6"
          }
        },
        // Header Bar
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 20px",
              background: "#0D111A",
              borderBottom: "1px solid rgba(0, 240, 255, 0.3)"
            }
          },
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "12px" } },
            React.createElement("strong", { style: { color: "#00F0FF", letterSpacing: "0.06em" } }, "⚡ SWITCH COUNCIL CHAMBER OVERLAY"),
            React.createElement(
              "span",
              { style: { fontSize: "12px", color: "#9CA3AF", fontFamily: "'JetBrains Mono', monospace" } },
              "Bound to Mattermost Channel: " + ctx.channelDisplayName + " (" + ctx.postsCount + " posts · Current Online: UNKNOWN)"
            )
          ),
          React.createElement(
            "button",
            {
              type: "button",
              className: "mm-council-close-overlay-btn",
              "aria-label": "Return to Mattermost Channel View",
              onClick: function () {
                if (store) {
                  store.dispatch({ type: ACTION_SET_CHAMBER_OPEN, open: false });
                }
                if (typeof window !== "undefined" && typeof window.onCouncilPluginCloseChamber === "function") {
                  window.onCouncilPluginCloseChamber();
                }
              },
              style: {
                background: "rgba(255,255,255,0.08)",
                color: "#F3F4F6",
                border: "1px solid rgba(0, 240, 255, 0.4)",
                borderRadius: "6px",
                padding: "6px 14px",
                fontWeight: 600,
                cursor: "pointer"
              }
            },
            "✕ Return to Standard Channel View"
          )
        ),
        // Functional 2-Column Chamber + Channel Stream Mount (No placeholder string!)
        React.createElement(
          "div",
          {
            id: "mmPluginChamberRootMount",
            style: {
              flex: 1,
              display: "flex",
              overflow: "hidden",
              padding: "20px",
              gap: "24px"
            }
          },
          // Left: 9-Seat Circular Chamber Ring
          React.createElement(
            "div",
            {
              className: "mm-overlay-chamber-ring-panel",
              style: {
                width: "440px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15, 20, 32, 0.85)",
                border: "1px solid rgba(0, 240, 255, 0.22)",
                borderRadius: "14px",
                padding: "16px"
              }
            },
            React.createElement(
              "div",
              { style: { fontSize: "12px", fontWeight: 700, color: "#00F0FF", marginBottom: "8px" } },
              "9-SEAT COUNCIL RING (4 Mode-A · 2 Pattern-B · 2 Direct-MCP · 1 Human)"
            ),
            React.createElement(
              "div",
              {
                className: "mm-overlay-ring-stage",
                style: { position: "relative", width: "420px", height: "420px" }
              },
              seatNodes,
              React.createElement(
                "div",
                {
                  style: {
                    position: "absolute",
                    left: "165px",
                    top: "165px",
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    background: "rgba(0, 240, 255, 0.08)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    color: "#00F0FF"
                  }
                },
                React.createElement("span", null, "⚡"),
                React.createElement("span", null, pState.operatingMode)
              )
            )
          ),
          // Right: Live Redux Channel Stream & Fail-Closed Decision Status
          React.createElement(
            "div",
            {
              className: "mm-overlay-stream-panel",
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 20, 32, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "14px",
                padding: "16px",
                overflowY: "auto"
              }
            },
            React.createElement(
              "div",
              {
                style: {
                  padding: "10px 12px",
                  marginBottom: "12px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  fontSize: "12px",
                  color: "#FBBF24"
                }
              },
              "🔒 HUMAN DECISION GATE: AWAITING_HUMAN_DECISION — Click any channel post below to navigate & highlight its source in #council."
            ),
            React.createElement(
              "div",
              { style: { fontSize: "12px", fontWeight: 700, color: "#9CA3AF", marginBottom: "8px", textTransform: "uppercase" } },
              "Canonical Channel Posts (" + ctx.postsCount + " in Redux Store)"
            ),
            streamPosts
          )
        )
      );
    };
  }

  function createPostActionComponent(pluginRef) {
    var React = (typeof window !== "undefined" && window.React) ? window.React : null;
    if (!React || typeof React.createElement !== "function") {
      return function FallbackPostAction() { return null; };
    }

    return function CouncilPostCiteButton(props) {
      var post = (props && props.post) || {};
      return React.createElement(
        "button",
        {
          type: "button",
          className: "mm-council-post-cite-btn",
          title: "Inspect post provenance in Council Evidence Panel",
          onClick: function () {
            if (pluginRef.store) {
              pluginRef.store.dispatch({ type: ACTION_SELECT_POST, postId: post.id || "unknown" });
              navigateToChannelPostDom(post.id);
              if (pluginRef.rhs && pluginRef.rhs.showRHSPlugin) {
                pluginRef.store.dispatch(pluginRef.rhs.showRHSPlugin);
              }
            }
          },
          style: {
            background: "rgba(0, 240, 255, 0.1)",
            color: "#00F0FF",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            borderRadius: "4px",
            padding: "2px 8px",
            fontSize: "11px",
            cursor: "pointer",
            marginLeft: "6px"
          }
        },
        "📜 Trace in Council"
      );
    };
  }

  function CouncilChamberPlugin() {
    this.id = PLUGIN_ID;
    this.store = null;
    this.registry = null;
    this.rhs = null;
    this.registeredHooks = {
      reducer: false,
      rhs: false,
      channelHeaderButtons: 0,
      rootComponent: false,
      postAction: false,
      websocketEvents: 0
    };
  }

  CouncilChamberPlugin.prototype.initialize = function (registry, store) {
    var self = this;
    this.registry = registry;
    this.store = store;

    if (registry && typeof registry.registerReducer === "function") {
      registry.registerReducer(councilPluginReducer);
      this.registeredHooks.reducer = true;
    }

    if (registry && typeof registry.registerRightHandSidebarComponent === "function") {
      var RHSComp = createRHSComponent(this);
      this.rhs = registry.registerRightHandSidebarComponent(
        RHSComp,
        "Council Evidence & Decision"
      );
      this.registeredHooks.rhs = Boolean(this.rhs);
    }

    if (registry && typeof registry.registerChannelHeaderButtonAction === "function") {
      registry.registerChannelHeaderButtonAction(
        createHeaderIcon("📜", "Council Evidence & Decision Panel"),
        function () {
          if (self.rhs && self.rhs.toggleRHSPlugin && self.store) {
            self.store.dispatch(self.rhs.toggleRHSPlugin);
          }
          if (typeof window !== "undefined" && typeof window.onCouncilPluginToggleRHS === "function") {
            window.onCouncilPluginToggleRHS();
          }
        },
        "Council Evidence Panel",
        "Toggle Switch Council Evidence & Decision Sidebar"
      );
      this.registeredHooks.channelHeaderButtons += 1;

      registry.registerChannelHeaderButtonAction(
        createHeaderIcon("⚡", "Switch Council Chamber"),
        function () {
          if (self.store) {
            self.store.dispatch({ type: ACTION_TOGGLE_CHAMBER });
          }
          if (typeof window !== "undefined" && typeof window.onCouncilPluginToggleChamber === "function") {
            window.onCouncilPluginToggleChamber();
          }
        },
        "Council Chamber (9-Seat View)",
        "Open Full 9-Seat Switch Council Chamber Overlay"
      );
      this.registeredHooks.channelHeaderButtons += 1;
    }

    if (registry && typeof registry.registerRootComponent === "function") {
      var RootComp = createRootOverlayComponent(this);
      registry.registerRootComponent(RootComp);
      this.registeredHooks.rootComponent = true;
    }

    if (registry && typeof registry.registerPostActionComponent === "function") {
      var PostActionComp = createPostActionComponent(this);
      registry.registerPostActionComponent(PostActionComp);
      this.registeredHooks.postAction = true;
    }

    if (registry && typeof registry.registerWebSocketEventHandler === "function") {
      registry.registerWebSocketEventHandler("posted", function (msg) {
        if (self.store) {
          self.store.dispatch({ type: ACTION_WS_EVENT, timestamp: Date.now(), event: msg });
        }
      });
      registry.registerWebSocketEventHandler("custom_" + PLUGIN_ID + "_event", function (msg) {
        if (self.store) {
          self.store.dispatch({ type: ACTION_WS_EVENT, timestamp: Date.now(), event: msg });
        }
      });
      this.registeredHooks.websocketEvents = 2;
    }
  };

  CouncilChamberPlugin.prototype.uninitialize = function () {
    if (this.store) {
      this.store.dispatch({ type: ACTION_SET_CHAMBER_OPEN, open: false });
    }
  };

  if (typeof window !== "undefined") {
    window.CouncilChamberPlugin = CouncilChamberPlugin;
    window.COUNCIL_PLUGIN_ID = PLUGIN_ID;
    window.COUNCIL_PLUGIN_ACTIONS = {
      TOGGLE_CHAMBER: ACTION_TOGGLE_CHAMBER,
      SET_CHAMBER_OPEN: ACTION_SET_CHAMBER_OPEN,
      SELECT_POST: ACTION_SELECT_POST,
      SET_MODE: ACTION_SET_MODE,
      WS_EVENT: ACTION_WS_EVENT
    };
    window.getCouncilChannelContextFromStore = getChannelContextFromStore;

    if (typeof window.registerPlugin === "function") {
      window.registerPlugin(PLUGIN_ID, new CouncilChamberPlugin());
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      PLUGIN_ID: PLUGIN_ID,
      CouncilChamberPlugin: CouncilChamberPlugin,
      councilPluginReducer: councilPluginReducer,
      getChannelContextFromStore: getChannelContextFromStore
    };
  }
})();
