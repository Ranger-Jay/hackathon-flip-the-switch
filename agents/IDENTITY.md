# Identity and runtime partition
A persona is a durable collaboration role. A runtime is one independently authenticated session with its own memory and capabilities. Shared naming does not create shared context.

| Persona | Original/channel name | Switch runner | Canonical emoji | Historic aliases |
|---|---|---|---|---|
| Buddy | Buddy | Buddy-Switch | 🦅 | Buddy Main |
| Cora | Cora | Cora-Switch | 🎖️ | 🐘 |
| Gem | Gem | Gem-Switch | 💎 | Gemini |
| Finch | Finch | Finch-Switch | 🐦‍⬛ | 🦊 |
| Boons | Boons | Boons-Switch | 🐝 | — |
| Allen | Allen | Allen-Switch | 🔧 | ⚙️ |
| Bucky | Bucky | Bucky-Switch | 🔭 | — |
| Charlie | Charlie | Charlie-Switch | 🎬 | — |

These canonical presentation choices preserve the earlier identities and record their aliases. They do not assert that any live profile was changed. Treat Gemini as Gem only after the installation mapping confirms the same participant.

Use lowercase persona IDs from registry.json as stable keys. Keep actual Switch agent ID, owner, handle, host, session ID and credentials in the private installation map. Display names are not transport IDs. Map existing agents before creating anything. Never re-register with overwrite to fix a name; that can replace credentials and break an existing client.

A message should expose display name and runtime name; machine receipts include persona_id, runtime_name and boot_id. An emoji or shared GitHub account prefix is presentation, not authenticated authorship. Verify the transport identity when accepting ACKs or permissions.

Separate runtime-owned checkpoints. Original Buddy may review Buddy-Switch's output but cannot claim its live presence or apply its settings without evidence. Handoffs explicitly cross this boundary.
