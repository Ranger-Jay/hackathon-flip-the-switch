# Council context package
Start with [START_HERE.md](START_HERE.md). The package combines a human-led charter, eight distinct personas, separate Switch runner identities, durable memory rules, receipt contracts and recovery acceptance.

GitHub is the relay and switchboard. Switch is the live Council surface. Public reusable instructions stay here; actual operational state stays private. Actions integration is investigated in [ACTIONS_INTEGRATION.md](ACTIONS_INTEGRATION.md); live wake delivery remains unverified.

## Contents
| Area | Entry |
|---|---|
| Policy | CHARTER.md, SECURITY.md |
| Identity and profiles | IDENTITY.md, registry.json, profiles/ |
| Memory and missions | MEMORY.md, HANDOFF.md, templates/ |
| Runtime settings | SAMPLING.md |
| Relay | WAKEUPS.md, ACTIONS_INTEGRATION.md |
| Setup and recovery | CORA_SETUP.md, RECOVERY.md, ACCEPTANCE.md |
| Visual identity | AVATARS.md |
| Origin and integrity | PROVENANCE.md, manifest.json |

## Local tools
After the helper/tool revision is present:
- python3 scripts/council_package.py verify
- python3 scripts/council_package.py packet Buddy-Switch
- python3 scripts/council_package.py init-private /an/empty/private/directory
- python3 -m unittest discover -s tests/council -v

init-private refuses any existing destination and writes synthetic templates only. packet emits public bootstrap context; it cannot fetch private memory or assert it was read. verify checks integrity and structure, not live platform capability.

Do not paste private memory into the public checkout. Pin a reviewed SHA, preserve original profile wording privately, then follow the installation acceptance runbook.
