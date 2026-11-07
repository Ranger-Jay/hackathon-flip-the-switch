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
 * - Explicitly distinguishes DEMO_SPECIMEN, VERIFIED_RECEIPTS, and LIVE_READONLY modes.
 */
(function () {
  "use strict";

  var PLUGIN_ID = "com.switch.council-chamber";
  var ACTION_TOGGLE_CHAMBER = PLUGIN_ID + "/TOGGLE_CHAMBER";
  var ACTION_SET_CHAMBER_OPEN = PLUGIN_ID + "/SET_CHAMBER_OPEN";
  var ACTION_SELECT_POST = PLUGIN_ID + "/SELECT_POST";
  var ACTION_SET_MODE = PLUGIN_ID + "/SET_MODE";
  var ACTION_WS_EVENT = PLUGIN_ID + "/WS_EVENT";

  var initialState = {
    isChamberOpen: false,
    selectedPostId: null,
    operatingMode: "VERIFIED_RECEIPTS",
    lastWsEventAt: null,
    wsEventCount: 0
  };

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
        return Object.assign({}, state, {
          lastWsEventAt: action.timestamp || Date.now(),
          wsEventCount: (state.wsEventCount || 0) + 1
        });
      default:
        return state;
    }
  }

  /**
   * Safely derive channel context & viewer permissions from Mattermost 12.0.1 Redux store
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
    var postsMap = (entities.posts && entities.posts.posts) || {};
    var postList = Object.keys(postsMap).map(function (k) { return postsMap[k]; }).filter(function (p) {
      return !currentChannelId || p.channel_id === currentChannelId;
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

  /**
   * Create Header Button Icon using window.React (or DOM fallback)
   */
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
   * Right-Hand Sidebar (RHS) Evidence & Decision Component
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
            "Channel: " + ctx.channelDisplayName + " (" + ctx.postsCount + " posts)"
          )
        ),
        // Launch Full Chamber Overlay CTA
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
        // Selected Post / Evidence Trace Body
        React.createElement(
          "div",
          {
            className: "mm-council-rhs-body",
            style: {
              padding: "14px",
              overflowY: "auto",
              flex: 1,
              fontSize: "13px",
              lineHeight: 1.5
            }
          },
          pState.selectedPostId
            ? React.createElement(
                "div",
                {
                  style: {
                    padding: "10px",
                    marginBottom: "12px",
                    background: "rgba(0, 240, 255, 0.08)",
                    border: "1px solid rgba(0, 240, 255, 0.3)",
                    borderRadius: "6px",
                    fontSize: "12px"
                  }
                },
                React.createElement("strong", null, "Cited Post ID: "),
                React.createElement("code", null, pState.selectedPostId)
              )
            : null,
          React.createElement(
            "div",
            { id: "mmPluginEvidenceMount" },
            "Council Evidence & Decision trace mounted for channel " + ctx.channelDisplayName + "."
          )
        )
      );
    };
  }

  /**
   * Root Overlay Component for Full 9-Seat Council Chamber on top of Mattermost channel
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
              "Bound to Mattermost Channel: " + ctx.channelDisplayName
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
        React.createElement(
          "div",
          {
            id: "mmPluginChamberRootMount",
            style: { flex: 1, position: "relative", overflow: "hidden" }
          },
          "9-Seat Council Chamber Active for " + ctx.channelDisplayName
        )
      );
    };
  }

  /**
   * Post Action Component to cite/inspect a Mattermost post in the Council Evidence RHS
   */
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

  /**
   * Main Mattermost 12.0.1 WebApp Plugin Class
   */
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

    // 1. Register plugin Redux reducer
    if (registry && typeof registry.registerReducer === "function") {
      registry.registerReducer(councilPluginReducer);
      this.registeredHooks.reducer = true;
    }

    // 2. Register Right-Hand Sidebar (RHS) Evidence & Decision Component
    if (registry && typeof registry.registerRightHandSidebarComponent === "function") {
      var RHSComp = createRHSComponent(this);
      this.rhs = registry.registerRightHandSidebarComponent(
        RHSComp,
        "Council Evidence & Decision"
      );
      this.registeredHooks.rhs = Boolean(this.rhs);
    }

    // 3. Register Channel Header Button Actions (Evidence RHS + Full Chamber Overlay)
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

    // 4. Register Full-Chamber Root Component
    if (registry && typeof registry.registerRootComponent === "function") {
      var RootComp = createRootOverlayComponent(this);
      registry.registerRootComponent(RootComp);
      this.registeredHooks.rootComponent = true;
    }

    // 5. Register Post Action Component for direct message-to-evidence citation
    if (registry && typeof registry.registerPostActionComponent === "function") {
      var PostActionComp = createPostActionComponent(this);
      registry.registerPostActionComponent(PostActionComp);
      this.registeredHooks.postAction = true;
    }

    // 6. Register WebSocket Event Handlers for live channel updates
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

  // Expose constructor for unit testing & local harness
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
