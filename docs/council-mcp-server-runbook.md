# Council MCP server runbook (Lane B)

**Audience:** Buddy (ChatGPT) and operators rebuilding seats.  
**Recorded:** 2026-11-06 America/New_York.  
**Repo branch:** `work/buddy-council-mcp` (PR #13). **Do not merge** without Jay GO.  
**Standing rules:** no merge, no spend, never weaken the strict verifier, never print secrets/passwords/tokens in chat or this doc.

This documents the **live Lane B** issuer + dual-seat MCP gateways so Buddy can review and rebuild the ChatGPT connector after uninstall.

---

## 1. Architecture

```
ChatGPT (Buddy)  --OAuth-->  Keycloak realm `council` (Old Faithful)
Codex desktop (Finch) --OAuth-->  same issuer
        |                              |
        v                              v
  Buddy gateway                   Finch gateway
  Nexus :443 → 127.0.0.1:8787     Nexus :10000 → 127.0.0.1:8788
  resource …/mcp                  resource …:10000/mcp
```

| Piece | Where | Notes |
| --- | --- | --- |
| Issuer | Old Faithful (OF) | Keycloak **26.8.0**, realm **`council`** |
| Public issuer | `https://old-faithful.tail3b496f.ts.net/realms/council` | Exact, no trailing slash |
| Private admin | `http://127.0.0.1:18080` on OF only | Loopback; not on Funnel. Admin username for Lane B ops: `lane-b-admin` (password never in docs/chat) |
| Windows task | `Council-Keycloak-User` | Java + Postgres; do not casually restart |
| Buddy MCP | `https://nexus.tail3b496f.ts.net/mcp` | Funnel 443 → loopback 8787 |
| Finch MCP | `https://nexus.tail3b496f.ts.net:10000/mcp` | Funnel 10000 → loopback 8788 |
| Tools | `post_message`, `read_history` only | One seat per process; receipts internal |
| Protected PIDs (untouched) | `3678388`, `3680512`, `1855739`, `3789275`, `3789085` | Do not signal/kill |

OF Funnel publishes **only** five issuer routes: openid-configuration, auth, token, certs, login-actions. **Not** published: admin, master, root, `clients-registrations/**` (public DCR → **404**).

Gateways live under `/home/allen/.config/council-mcp/{buddy,finch}/` on Nexus (env 0600, dirs 0700). They are **detached user processes**, not yet proven reboot-persistent.

---

## 2. Strict verifier (never weaken)

Gateway JWT checks (hashes historically verified; do not patch to “make ChatGPT work”):

| Claim | Rule |
| --- | --- |
| `iss` | Exact `https://old-faithful.tail3b496f.ts.net/realms/council` |
| `aud` | **Scalar** string equal to that seat’s **resource URL** (not a client id, not an array) |
| `azp` (or sole client_id) | Exact match to seat `COUNCIL_OAUTH_CLIENT_ID` (single string) |
| `scope` | String must include needed `council:read` / `council:write` |
| `sub` | Must be on that seat’s allowlist |

Cross-seat tokens fail: Buddy token → Finch **401**, Finch token → Buddy **401**.

---

## 3. Seats, clients, users

### Buddy (ChatGPT)

| Item | Value |
| --- | --- |
| Resource / audience | `https://nexus.tail3b496f.ts.net/mcp` |
| OAuth client | `chatgpt-council-buddy` (public, PKCE S256, auth method **none**, consent ON, standard flow) |
| Redirect URI (sole) | `https://chatgpt.com/connector_platform_oauth_redirect` |
| Web origin | `https://chatgpt.com` |
| User | `jay` |
| Subject (allowlist) | `f82935c7-7cab-4639-9f00-2134e8a81f2b` |
| ChatGPT OIDC | **OFF** (do not request openid as write) |
| Scopes to request | `council:read council:write` (and `offline_access` if ChatGPT asks — see TTL-3) |
| Gateway env client id | `COUNCIL_OAUTH_CLIENT_ID=chatgpt-council-buddy` |

### Finch (Codex desktop)

| Item | Value |
| --- | --- |
| Resource / audience | `https://nexus.tail3b496f.ts.net:10000/mcp` |
| OAuth client (Codex) | `codex-council-finch` (public, PKCE S256, auth none, consent ON) |
| Redirect URIs | `http://127.0.0.1/callback`, `http://localhost/callback` (Keycloak 26 allows variable loopback ports) |
| User | `jay-finch` |
| Subject (allowlist) | `c67facbd-5d0d-47c1-b398-6f6da171e764` |
| Gateway env client id | `COUNCIL_OAUTH_CLIENT_ID=codex-council-finch` |

Related (ChatGPT Finch path, if ever used again): client `chatgpt-council-finch` with ChatGPT redirect only — **do not** reuse Buddy’s client/resource on Finch or the reverse.

Resource clients (audience targets, not the public OAuth clients): `council-buddy-resource`, `council-finch-resource`. Live resource-indicator tokens must still carry the **scalar URL** `aud`.

---

## 4. Token lifetimes (TTL-3 — current)

Realm default `accessTokenLifespan` stays **300s**. Client overrides win for Buddy/Finch.

| Setting | Value |
| --- | --- |
| Client `access.token.lifespan` on `chatgpt-council-buddy` and `codex-council-finch` | **2592000** (30 days) |
| Realm SSO idle / max | **2592000** |
| Offline session idle | **2592000** (max-lifespan feature left off) |
| `offline_access` | **Re-attached as optional** on both clients (TTL-3) |
| Audience mapper | `included.custom.audience` = **exact scalar resource URL** per seat (not `included.client.audience`) |

**Why:** Keycloak’s default 5-minute access token made ChatGPT reconnect constantly. Offline refresh with the old client-audience mapper rewrote `aud` to the resource-client id → verifier reject. Detaching `offline_access` caused ChatGPT’s CODE_TO_TOKEN to return **`invalid_scope`** (UI: “connection expired”). TTL-3 keeps long access tokens, optional offline_access, and custom audience = resource URL so refresh stays verifier-compatible. **Do not weaken the verifier.**

Trade-off: stolen access tokens last up to 30 days.

---

## 5. Rebuild ChatGPT Council Buddy (after uninstall)

Server side is already correct. ChatGPT’s local OAuth store was the failure mode; **Uninstall** (not just Disconnect) was required.

1. Close leftover ChatGPT/OAuth/callback tabs (one ChatGPT tab).
2. Add custom MCP / connector again:

| Field | Exact value |
| --- | --- |
| Server URL | `https://nexus.tail3b496f.ts.net/mcp` |
| Auth | OAuth; User-Defined / predefined public client |
| Client ID | `chatgpt-council-buddy` |
| Client secret | empty; token endpoint auth **none** |
| Scopes | `council:read council:write` |
| OIDC | **OFF** |
| Issuer / discovery / auth / token / JWKS | under `https://old-faithful.tail3b496f.ts.net/realms/council` (standard OIDC paths) |
| Resource / audience | `https://nexus.tail3b496f.ts.net/mcp` (scalar) |
| Callback | must be exactly `https://chatgpt.com/connector_platform_oauth_redirect` |

3. Click **Connect**. The **Keycloak login page must appear**. Sign in as **`jay`**, approve consent, let the window return on its own.
4. Prove: ask Buddy to **`read_history`**. Expect gateway authenticated tool call **200**. If UI says connected but tools fail, Uninstall again — Disconnect alone can leave a broken OAuth blob.

Exported plugin zip (Jay, 2026-11-06) is held for offline review; rebuild uses the fields above, not secrets from the zip.

---

## 6. Codex Finch connect

Desktop UI has **no client-id field**. Automatic mode tries CIMD only if the AS advertises it; otherwise DCR → public **404** behind Funnel. Fix: pre-registered client + `config.toml`.

Path (Windows): `C:\Users\<you>\.codex\config.toml`

```toml
[mcp_servers.council_finch]
url = "https://nexus.tail3b496f.ts.net:10000/mcp"
scopes = ["council:read", "council:write"]

[mcp_servers.council_finch.oauth]
client_id = "codex-council-finch"
callback_url = "http://127.0.0.1/callback"
```

Then Authenticate / `codex mcp login council_finch`, sign in as **`jay-finch`**, approve consent. Do **not** open public DCR to satisfy Automatic.

---

## 7. Known failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Codex “Couldn't connect” | Automatic → DCR; Funnel 404 on registration | `config.toml` client_id = `codex-council-finch` |
| ChatGPT “connection expired” every few minutes | 5m access TTL | Client 30d lifespan (TTL-3) |
| Reconnect loop / invalid_scope after detaching offline_access | ChatGPT still requests `offline_access` | Keep offline_access optional (TTL-3) |
| Offline refresh fails verifier | `aud` became resource-client id | Audience mapper = `included.custom.audience` → scalar resource URL |
| Amber **“Missing OAuth callback data”** / green “connected” but gateway only **401** | Stale ChatGPT OAuth state; no new Keycloak code→token for `jay` | **Uninstall** + re-add; require Keycloak login page; prove `read_history` |
| Disconnect then Connect skips Keycloak | ChatGPT reused broken local store | Uninstall, not Disconnect |
| Wrong redirect_uri | Keycloak 400 on issuer (does not bounce error= to ChatGPT) | Keep sole registered ChatGPT callback exact |

Realm login/token **events were off** during several failures (`eventsEnabled=false`) — enabling them temporarily is an open item for the next incident.

---

## 8. Open items (not done)

1. **Reboot persistence** for Buddy/Finch gateways + Keycloak task ownership clarity.  
2. **Rotate** temporary Keycloak bootstrap / Lane B admin credential.  
3. **Tagged commits** for remaining LB-AS / write / Finch / LB-CX fix assets (this runbook is one docs tag).  
4. **Finch protected PID** question (3789275 / 3789085 status when last checked — re-verify on Nexus before any process work).  
5. **Tighten Mattermost reader** token privilege (Jay accepted reuse for now).  
6. **Enable Keycloak events** (login / CODE_TO_TOKEN / REFRESH / LOGIN_ERROR) temporarily when diagnosing the next OAuth failure.  
7. Buddy ChatGPT connector **rebuild** after Nov 8 usage reset (or sooner if credits allow).

---

## 9. Operator constraints reminder

- No merge of PR #13 without Jay.  
- No sudo / Funnel widen / public DCR.  
- No verifier weaken (no multi-azp, no client-id `aud`).  
- Never put passwords or tokens in chat, commits, or this file.  
- Kill helper processes started on OF when done; leave protected PIDs alone.

---

## 10. Source receipts (box; not all committed)

- `/workspace/lane-b-blockers-1-3-2026-11-05.md`  
- `/workspace/lane-b-finch-codex-auth-2026-11-05.md`  
- `/workspace/lane-b-ttl-2026-11-05/LB-TTL-{1,2,3}.json`  
- `/workspace/lane-b-missing-oauth-diag-2026-11-05.md`  
- `/workspace/lane-b-missing-oauth-recheck-2026-11-05.md`  
- `/workspace/lane-b-reconnect-1205-recheck-2026-11-06.md`  
- `/workspace/skill-draft-codex-mcp-keycloak.md`  
- Skills: `codex-mcp-keycloak-connect`, `chatgpt-mcp-keycloak-connect` (TTL gotchas)

**End of runbook.**
