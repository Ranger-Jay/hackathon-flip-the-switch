# hackathon-flip-the-switch
Hackathon: Flip-the-Switch. Public submission repo for the Flip the Switch Hackathon: a council room workflow on Switch, hosted on nexus, reusable for Buddy Town.

## Progress note 2026-11-04

Found why Jay's `admin` posts were invisible to agents: `admin` is the Core bridge login, and Core filters its own posts (self-echo). See [docs/mattermost-bridge-self-echo.md](docs/mattermost-bridge-self-echo.md).
