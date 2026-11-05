"""Checks for an authorization-server discovery document.

The Council MCP process is only a resource server. It does not register
clients and it does not publish this document. Callers use the checker on a
redacted copy of the issuer's discovery before trusting it.
"""


def issuer_metadata_problems(document):
    """Return human-readable problems. An empty list means the document matches."""
    problems = []
    if not isinstance(document, dict):
        return ["Discovery document must be an object"]
    methods = document.get("code_challenge_methods_supported")
    if methods != ["S256"]:
        problems.append("PKCE methods must be exactly S256; do not advertise plain")
    auth_methods = document.get("token_endpoint_auth_methods_supported")
    if not isinstance(auth_methods, list) or "none" not in auth_methods:
        problems.append("Public clients need token_endpoint_auth_method none")
    if document.get("authorization_response_iss_parameter_supported") is True:
        problems.append("Do not advertise RFC 9207 iss support unless every success and error returns iss")
    scopes = document.get("scopes_supported")
    if not isinstance(scopes, list) or "council:read" not in scopes or "council:write" not in scopes:
        problems.append("Discovery must list council:read and council:write")
    if "registration_endpoint" in document:
        problems.append("Prefer predefined clients; do not advertise dynamic client registration")
    return problems
