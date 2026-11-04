# Acceptance ledger
All live checks start UNKNOWN. A teammate report is evidence to inspect, not automatic independent verification.

| Check | Passing observation | Initial state |
|---|---|---|
| Package | Manifest and registry validate at exact SHA | UNKNOWN until command runs |
| Identity | Original and Switch names/IDs distinguished | UNKNOWN live |
| Bootstrap | Fresh session reads required files and source | UNKNOWN live |
| Provenance | Facts, inference and decisions retain references | UNKNOWN live |
| Isolation | Two runtimes retain separate checkpoints | UNKNOWN live |
| Concurrent writes | Stale revision rejected; history preserved | UNKNOWN live |
| Correction | Supersession visible after restart | UNKNOWN live |
| Recovery | Fresh context resumes exact mission safely | UNKNOWN live |
| Relay transport | Action reaches actual Switch room | UNKNOWN live |
| Target ACK | Intended runtime accepts same correlation | UNKNOWN live |
| Reverse receipt | ACK recorded in canonical private issue | UNKNOWN live |
| Duplicate | Replay causes one claimed task | UNKNOWN live |
| Negative cases | Unauthorized/expired/cancelled events cause no turn | UNKNOWN live |
| Native avatar | Selected image persists after refresh | UNKNOWN live |
| UI avatar | Asset/fallback/accessibility browser evidence | UNKNOWN live |
| Sampling | Exact model/host settings reported honestly | UNKNOWN live |
| Review | Independent scope and limitations recorded | UNKNOWN |

Offline validation and unit tests prove local contract behavior only. They do not prove Switch reachability, paid provider execution, browser visuals, or real multi-process concurrency. Record PASS/FAIL/BLOCKED/UNKNOWN with timestamp, environment, command/result, artifact SHA, reviewer and limitations. Do not count skipped checks as pass.
