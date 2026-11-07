# Switch Council Chamber — Mattermost 12.0.1 WebApp Plugin (`com.switch.council-chamber`)

Genuine Mattermost v12.0.1 WebApp plugin integrating the 9-Seat Council Chamber and Evidence & Decision Sidebar directly into the canonical `switch/council` channel without forking Mattermost or creating a second conversation.

## Registered Mattermost 12.0.1 Extension Points
- `registerReducer`: Isolated plugin Redux slice (`state['plugins-com.switch.council-chamber']`).
- `registerRightHandSidebarComponent`: Mounts the **Switch Council Evidence & Decision** sidebar in the RHS slot.
- `registerChannelHeaderButtonAction` (×2): Adds **Council Evidence** (RHS toggle) and **Council Chamber** (full 9-seat modal toggle) actions to the channel header.
- `registerRootComponent`: Mounts the expandable 9-Seat Council Chamber overlay bound to the active channel.
- `registerPostActionComponent`: Adds a **Cite in Council Evidence** action on channel posts.
- `registerWebSocketEventHandler`: Listens for `posted` events in the active Council channel for idempotent state updates.

## Build & Test
```bash
python mattermost-plugin-council/build_plugin.py
python scripts/test_mm_plugin.py
```
