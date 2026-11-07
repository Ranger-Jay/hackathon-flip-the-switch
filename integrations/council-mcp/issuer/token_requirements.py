"""Fail-closed claims for a Council resource token.

This is the policy the MCP verifier applies after signature, issuer and expiry
checks. It does not sign, exchange or widen tokens. In particular it will not
treat a client-id audience as the resource, and it will not map openid,
profile or email onto council:read or council:write.
"""

READ = "council:read"
WRITE = "council:write"


def council_scopes(claims, resource, client_id):
    """Return the scope list, or None when the claims must not be accepted."""
    if not isinstance(claims, dict):
        return None
    # Exact string audience. A list that merely contains the resource, and a
    # client-id audience, are both rejected.
    if claims.get("aud") != resource:
        return None
    azp = claims.get("azp")
    other = claims.get("client_id")
    if azp is not None and other is not None and azp != other:
        return None
    client = azp if isinstance(azp, str) else other
    if not isinstance(client, str) or client != client_id:
        return None
    raw = claims.get("scope")
    if not isinstance(raw, str):
        return None
    scopes = raw.split()
    if READ not in scopes:
        return None
    return scopes
