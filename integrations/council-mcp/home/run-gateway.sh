#!/bin/sh
# Check a home env file. This helper does not start the gateway, open a port,
# or call Tailscale. Funnel wiring is a separate GO. Rollback of a later manual
# start is to stop that one process; do not restart Switch, Dex, or protected PIDs.
set -eu
if [ "$(id -u)" -eq 0 ]; then
  echo "Refusing to run as root." >&2
  exit 1
fi
mode="${1:-}"
env_file="${2:-}"
if [ "$mode" != "--check" ] || [ -z "$env_file" ]; then
  echo "Usage: run-gateway.sh --check ENV_FILE" >&2
  echo "No start command is provided. Do not background this helper." >&2
  exit 2
fi
here=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
python3 "$here/check_env.py" "$env_file"
