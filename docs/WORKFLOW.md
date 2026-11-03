# Workflow contract — propose → review → decide → record

## One public-safe business scenario

The demo uses one real, non-sensitive proposal—for example, prioritizing a public-source evidence verification checkpoint in a research intake process. The exact proposal and decision must be chosen and posted by the human during the real demonstration. No fictional approval is attributed to the human.

## Steps and responsibilities

1. **Proposal:** The human posts the purpose, options, expected impact and deadline. Capture the Switch room ID and original message ID.
2. **Role-specific responses:** Each participating agent receives an addressed event and replies with a concise recommendation, supporting source/evidence, trade-offs and an explicit UNKNOWN when appropriate. Capture provider/session, original addressed event and posted response ID.
3. **Orchestrator reconciliation:** Collect real responses, resolve contradictions against room evidence, and separate agreement from unresolved questions. Link every claim to its source message.
4. **Human decision:** The human posts **APPROVE / DECLINE / DEFER**, with rationale and next owner. No agent may fabricate a human approval.
5. **Durable document:** Store one room-visible decision record that cites the proposal, individual responses, reconciliation and human decision message. Verify it survives reconnect.

## Draft decision-record shape

```json
{
  "schema_version": "1",
  "room_id": "opaque-room-reference",
  "proposal_id": "opaque-message-reference",
  "proposal_text": "Privacy-safe proposal",
  "responses": [
    {
      "agent": "role-and-provider-identity",
      "stance": "approve | decline | defer",
      "evidence_message_id": "opaque-message-reference",
      "unknowns": []
    }
  ],
  "buddy_summary": {
    "message_id": "opaque-message-reference",
    "agreed": [],
    "disputed": [],
    "unresolved": []
  },
  "jay_decision": {
    "outcome": "approve | decline | defer",
    "message_id": "opaque-human-message-reference",
    "next_owner": "named-owner"
  },
  "decision_document_link": "room-visible-document-reference",
  "recorded_at": "ISO-8601-timestamp"
}
```

This is a **proposed application-level shape**, not a claim about built-in Switch document APIs. Finch and Boons must confirm how durable room documents are actually created and referenced before claiming implementation.

## Fail closed

- **No real agent reply?** Show that agent as pending/unavailable, not as having voted.
- **Missing evidence?** Mark UNKNOWN and do not invent a citation.
- **Conflicting reports?** Compare exact room messages/logs; if unresolved, record the disagreement.
- **No human decision?** Mark DEFER / awaiting human, not approved.
- **Reconnect or retry?** Use event/message IDs to avoid duplicates and preserve provenance.
- **Switch unavailable?** Workflow pauses; display the outage truthfully.

## Success evidence

Exact room ID; one real proposal message; individual addressed event and reply IDs; reconciled summary ID; human decision ID; durable linked record; restart/reconnect proof. These are required before the demo is called complete.
