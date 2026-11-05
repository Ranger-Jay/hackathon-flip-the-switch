# Personality and model sampling
Personality is a set of communication and working habits. Temperature is a provider/model request parameter that may influence sampling. Prompt text does not apply an API setting.

The numerical targets in registry.json are NEW PROPOSED DEFAULTS, not recovered historical settings and not applied live configuration. Earlier profiles established voices and roles; no authoritative numeric temperatures were recovered for this package.

| Persona | Routine target | Exploration target | Evidence/review target |
|---|---:|---:|---:|
| Buddy | 0.45 | 0.65 | 0.10 |
| Cora | 0.25 | 0.40 | 0.10 |
| Gem | 0.80 | 0.90 | 0.20 |
| Finch | 0.25 | 0.40 | 0.10 |
| Boons | 0.30 | 0.50 | 0.10 |
| Allen | 0.25 | 0.45 | 0.10 |
| Bucky | 0.30 | 0.45 | 0.10 |
| Charlie | 0.65 | 0.80 | 0.20 |

These are proposed within the common 0–1 portion of some providers' ranges, not universal equivalent settings. Low temperature does not guarantee correctness or determinism; higher temperature does not grant good design judgment.

## Capability-aware application
For each exact provider, model ID, model version, host and reasoning mode, record requested_temperature, support (supported/unsupported/unknown), applied_temperature, evidence and observed_at. Default support is unknown and applied_temperature is null. Check current provider documentation and the real host's config/request surface. Model self-report and a dashboard label are insufficient.

If unsupported, omit the parameter and record the reason. If the host conceals sampling, leave the effective setting unknown. Preserve the requested target as metadata for future portability. Never disable appropriate reasoning merely to force a temperature parameter through. Reasoning effort and sampling are separate controls.

For OpenAI, sampling support depends on model and reasoning mode. Check the exact current model documentation and Codex configuration reference rather than assuming a temperature field is honored. Other providers require their own verification. Do not send multiple sampling controls by default.

Sources checked 2026-11-04:
- https://developers.openai.com/api/docs/guides/latest-model
- https://developers.openai.com/api/docs/guides/reasoning
- https://developers.openai.com/codex/config-reference

Use templates/runtime.json. Report requested and observed values separately. No test in this package proves a remote model accepted a setting.
