# Nexus Dex checklist for Council MCP

This file is an operator checklist. Applying it is a separate GO for Allen. This repository does not chmod the live Dex config, restart Dex, issue a token, or wire Funnel.

## What was already observed

Allen's read-only pass on 2026-11-05, with no secret values recorded:

- Dex container `council-dex`, image `ghcr.io/dexidp/dex:v2.43.1`, listening on `127.0.0.1:5556` with telemetry on `127.0.0.1:5558`.
- The on-disk config mode is `0644` and it contains a local password database. Change that file to owner-only `0600` before any live token is issued. This repository does not do that chmod.
- Discovery does not advertise `council:read` or `council:write`.
- The reported token shape uses the client id as `aud` and does not carry the council scope claim. Custom scopes were not accepted.
- One static public client and three static redirect URIs. None of them is the ChatGPT connector callback.
- `skipApprovalScreen: true` is set. Per-principal consent is not real while that remains.

The MCP verifier denies that token shape. Do not change the verifier to accept it.

## Token the verifier will accept

Every claim below has to be inside a token signed by the key published at the configured JWKS URL.

| Claim | Required value |
| --- | --- |
| `iss` | Exactly `COUNCIL_OAUTH_ISSUER`, including a trailing slash when the issuer uses one |
| `aud` | Exactly the seat resource, as a string. Buddy candidate: `https://nexus.tail3b496f.ts.net/mcp`. Finch candidate: `https://nexus.tail3b496f.ts.net:8444/mcp`. A client-id audience is denied. An array that merely contains the resource is denied. |
| `azp` or `client_id` | Exactly that seat's client. Proposed ids: `chatgpt-council-buddy` and `council-finch`. The old shared id `chatgpt-council-mcp` is denied. The subject is not a client id. |
| `scope` | A single space-delimited string. `council:read` is required. `council:write` is required only for `post_message`. `openid`, `profile` and `email` do not imply either council scope. |
| `sub` | One subject on that seat's allowlist, and not on the other seat's allowlist |
| `iat`, `exp` | Both present. Expiry is checked on every request. There is no revocation feed in this gateway. |

## Why a config edit alone is not enough

Dex v2.43.1 does not implement RFC 8707 resource indicators. Putting `council:read` in a static client block does not make Dex set `aud` to the MCP resource. A broker that takes today's Dex token and rewrites `aud` or adds `council:write` would be the weakening this lane forbids. `token_requirements.py` only returns the scopes already present; it does not sign a replacement token.

Acceptable issuer follow-ups, each under its own GO, with no Auth0 or Keycloak spend unless that spend is explicitly approved:

1. Use an issuer that already signs resource-bound JWTs and the two council scopes.
2. Add a reviewed Dex extension that copies the requested resource into `aud` and emits only the council scopes the client was actually granted, and that refuses to default those scopes from `openid`.

## Before any wire GO

1. Dex config is owner-only `0600`. Allen does this on the host. This agent does not.
2. Two public clients, not the shared one, with the exact ChatGPT callback copied from the management page. See the registration notes added with the PKCE metadata fix.
3. A smoke that does not print the token: discovery lists both council scopes; a Buddy token's `aud` equals the Buddy resource; that token is rejected at the Finch resource; an `openid`-only token is rejected.
4. Funnel approval and Funnel wiring remain separate Jay decisions. This checklist does not include serve or funnel commands.
