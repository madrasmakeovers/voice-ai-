---
docVersion: "1.1.0"
docUpdated: "2026-09-09"
---

# Process and call reads

Complete [Pong](../SKILL.md) preflight. Use `dino-staging` for staging. Read only
actor-visible processes; never treat a supplied account ID as authorization.

```text
dino process list
dino process list --phase running,paused
dino process get --process-id <returned-uuid>
dino process list-calls --process-id <uuid> --limit 50 --offset 0
dino process get-call --process-id <uuid> --call-id <returned-call-uuid>
```

Use one required list form and only needed detail commands. Add
`--search <phone-fragment>` to narrow one process's call page. Increase offset
by limit only when another page is needed. Call detail includes post-tools and
is bound to both IDs; another process's call returns `404`.

Call pages expose answered calls, have no call timestamp, and do not guarantee
newest-first order. They cannot establish “today's” or “latest” calls. Use
[batch export](batch.md) for broader contact outcomes, including unanswered
contacts. Lens URLs are scoped access links; later reads do not renew expiry.

## Archive notification status

For Batch and Drip, `list-calls` and `get-call` can include `triggerStatus`.
This is the HTTP response status from the process's configured archive notification.
A non-success status is retained; Command does not retry the notification.
An absent status does not prove that the receiver received nothing: delivery can time out after receipt.
The field is also absent before delivery or when no trigger is configured.
See [archive notification](process-create.md#archive-notification) for the payload and timing.

## Find processes for an agent

Resolve a known ID with `agent get --agent-id <uuid>` and, if needed,
`agent history --genesis-id <uuid>`. When the ID is unknown, use
`agent list --pattern <anchored-regex>` before detail reads.

For an AM/Admin, filter typed `process list` results by exact returned
`agentId`, then show only matched summaries and fetch bounded call pages.
Never match by name or inspect rendered flow text. Limitations:

- Client process projections omit `agentId`; they can select their own process
  but cannot perform this correlation.
- Process responses omit owner identity; even an Admin cannot map a process
  to an IAM identity from these fields.
- Experience's lazy interactive processes are not publicly enumerable.

Report missing atomic facts instead of consulting private infrastructure.
Use Ping's Preview workflow for Preview history/status.

## Change integrations

Processes have no attach/detach command. Evolve the agent through Ping to add,
change, or remove integrations. A genesis-referenced process resolves the
latest active version on its next call; an exact version reference remains
pinned. Existing calls retain their starting version snapshot.

## Failures

Use structured `error.apiCode`, `error.code`, and details, not error text:

- `401`: repair the selected workspace credential without exposing it.
- `403`: report missing role/tier; do not switch identities implicitly.
- `404`: missing or out of scope; do not probe alternate IDs/routes.
- `409`: inspect lifecycle or conflict details and refresh relevant state.

Never blindly replay a mutation; every retry follows Ping's approval gate.
