"""Check a home-deploy env file. Does not start the gateway or read secret files."""
import sys
from pathlib import Path
from urllib.parse import urlsplit

BUDDY_ORIGIN = "https://nexus.tail3b496f.ts.net"


def parse_env(text):
    values = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):]
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip("'").strip('"')
        values[key.strip()] = value
    return values


def problems(path):
    """Return safety problems for an env file. Empty means the file is safe to keep, not safe to expose."""
    path = Path(path)
    text = path.read_text()
    if "-----BEGIN " in text:
        return ["Env file contains a private key block"]
    values = parse_env(text)
    found = []
    if values.get("COUNCIL_ENABLE_WRITES") != "false":
        found.append("COUNCIL_ENABLE_WRITES must be false for the initial HTTP home file")
    if values.get("COUNCIL_SEAT") not in ("buddy", "finch"):
        found.append("COUNCIL_SEAT must be buddy or finch")
    if values.get("COUNCIL_TRANSPORT") != "streamable-http":
        found.append("Home HTTP file must set COUNCIL_TRANSPORT=streamable-http")
    if values.get("COUNCIL_ALLOW_LOOPBACK_HTTP") == "true":
        found.append("Home HTTP file must not allow loopback HTTP")
    origin = values.get("COUNCIL_PUBLIC_URL", "").rstrip("/")
    parsed = urlsplit(origin)
    if parsed.scheme != "https" or not parsed.hostname or parsed.path not in ("",):
        found.append("COUNCIL_PUBLIC_URL must be an HTTPS origin")
    if values.get("COUNCIL_SEAT") == "finch" and origin in (BUDDY_ORIGIN, BUDDY_ORIGIN + "/mcp"):
        found.append("Finch must not reuse the Buddy resource origin")
    for key in ("COUNCIL_MM_TOKEN_FILE", "COUNCIL_SWITCH_TOKEN_FILE", "COUNCIL_STATE_FILE"):
        location = values.get(key, "")
        if not location:
            found.append("Missing " + key)
            continue
        expanded = location.replace("${HOME}", "/home/service").replace("$HOME", "/home/service")
        if expanded.startswith("/opt") or expanded.startswith("/etc") or expanded.startswith("/var"):
            found.append(key + " must stay under the service home directory, not /opt, /etc or /var")
    return found


def main(argv):
    if len(argv) != 2:
        print("Usage: check_env.py ENV_FILE", file=sys.stderr)
        return 2
    found = problems(argv[1])
    if found:
        print("\n".join(found), file=sys.stderr)
        return 1
    print("home env check passed; writes remain off; gateway was not started")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
