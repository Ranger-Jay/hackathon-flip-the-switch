# Public assessment and decision trace

The Council should make its work understandable through concise public assessments, sources, options, uncertainty and observable action receipts. This is an auditable explanation of the work and decision. It is not access to an agent's private internal chain-of-thought, and must not be presented as one.

## One assessment per assigned role
Use templates/assessment.md. Include:
- Mission/correlation, source proposal and actual responding runtime/seat.
- Recommendation and the question the assessment answers.
- Relevant observations, primary/source links and exact artifact revision.
- Material options and tradeoffs; why the recommendation fits the stated goal.
- Assumptions, uncertainty, unresolved risks and disagreement.
- Observable actions/checks and their actual results; label failed or unrun checks.
- Next owner/action and the limits of the assessment.

Do not fabricate a stream of thoughts, an agent quote, a tool call, a source, a cost reading or a completed check. A public explanation may be written after the work; do not imply it is a verbatim transcript of hidden model reasoning.

## Display in the Council UI
Show a clear assessment card with expandable evidence and action receipts. Link to actual room/GitHub messages and artifacts. Display the real runtime and execution mode: original session, separately hosted worker, or explicitly labeled relay/manual assistance.

Use distinct proposal, assessment, reconciliation, human decision and follow-up states. Show unresolved uncertainty and dissent. Real timestamps/latencies and usage data may be displayed only when observed from the host/provider; otherwise show unavailable. Do not add model calls merely to animate a reasoning panel or refresh presence.

Provider-supplied reasoning summaries may be shown when the selected model/host supports and returns them. Label them as summaries. They are optional and do not replace task evidence, sources or human authority. OpenAI's current official guide distinguishes opt-in reasoning summaries from unexposed raw reasoning:
https://developers.openai.com/api/docs/guides/reasoning

## Reconciliation and human decision
The orchestrator references each assessment, identifies agreement/disagreement, compares the material options and states remaining blockers. The human explicitly approves, declines or defers in the existing room. Preserve the human-authored source message; a bot, scripted demo or model recommendation cannot supply that decision.

The durable decision record includes proposal and assessment references, selected option, human authority/source, rationale summary, dissent, risks, owner and next action. Reopen it in a fresh context and verify those fields against sources.

## Demonstration boundary
Demo/specimen content remains unmistakably labeled and separate from live decisions. Never promote a simulated approval, invented identity hash or animation into evidence. Public exports are sanitized; private operational identifiers, credentials and restricted conversations stay private. Agent communication and usage controls in CHARTER.md remain mandatory.
