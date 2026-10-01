---
docVersion: "1.1.0"
docUpdated: "2026-09-10"
---

# Dino Pong operation contract

Use [Pong](../SKILL.md) through `dino` (production) or `dino-staging`
(staging). Routes below identify contracts only; invoke the native CLI, never
HTTP directly. Match the intended operation against installed capabilities.

| CLI operation | Method | Public route | Authorization |
| --- | --- | --- | --- |
| `process.list` | GET | `/api/processes` | Actor-visible processes |
| `process.get` | GET | `/api/processes/{id}` | Owner/manager scope |
| `process.calls.list` | GET | `/api/processes/{id}/calls` | Owner/manager scope |
| `process.calls.get` | GET | `/api/processes/{id}/calls/{call_id}` | Process-bound call |
| `simulation.run` | POST | `/api/simulations` | Pong Client or Account Manager self; granted runtime and partner credentials; two Widget slots |
| `simulation.get` | GET | `/api/simulations/{id}` | Exact owner; both call reports and available Lens URLs |
| `simulation.list` | GET | `/api/simulations` | Exact owner; newest first; limit 1–100 and nonnegative offset |
| managed Client catalogue | GET | `/api/account/clients` | Account Manager's directly managed Clients |
| `process.batch.create` | POST | `/api/processes` | Pong Client self; Account Manager self or direct Pong Client; Ops Admin explicit target |
| `process.drip.create` | POST | `/api/drip-processes` | Same target scope |
| `process.inbound.create` | POST | `/api/inbound-processes` | Same target scope |
| `process.batch.discard` | DELETE | `/api/batch-processes/{id}` | Owner/manager; provisioned only |
| `process.batch.importCsv` | PUT | `/api/batch-processes/{id}/source/csv` | Owner/manager; provisioned only |
| `process.batch.importGoogleSheet` | PUT | `/api/batch-processes/{id}/source/google-sheet` | Owner/manager; provisioned only |
| `process.batch.setPhase` | PUT | `/api/batch-processes/{id}/phase` | Owner/manager; valid transition |
| `process.batch.retry` | POST | `/api/batch-processes/{id}/retry` | Owner/manager; eligible completed batch |
| `process.batch.exportContacts` | GET | `/api/batch-processes/{id}/contacts.csv` | Owner/manager |
| `process.drip.placeCall` | POST | `/api/drip-processes/{id}/contacts` | Exact owner |
| `process.drip.addContacts` | POST | `/api/drip-processes/{id}/contacts` | Exact owner |
| `process.drip.pause` | PUT | `/api/drip-processes/{id}/lifecycle` | Exact owner |
| `process.drip.resume` | PUT | `/api/drip-processes/{id}/lifecycle` | Exact owner |
| `process.drip.close` | PUT | `/api/drip-processes/{id}/lifecycle` | Exact owner |
| `process.inbound.close` | POST | `/api/inbound-processes/{id}/close` | Owner/manager |
| `process.drip.failedCallbacks.get` | GET | `/api/drip-processes/{id}/failed-callbacks` | Exact owner |
| `process.drip.failedCallbacks.ack` | POST | `/api/drip-processes/{id}/failed-callbacks/ack` | Exact owner |
| `experience.assign` | POST | `/api/experience/agents` | Account Manager |
| `experience.update` | PUT | `/api/experience/assignments/{id}` | Account Manager-owned source assignment |
| `experience.clone` | POST | `/api/experience/assignments/{id}/clone` | Account Manager and directly managed Client; empty body |
| `experience.disable` | DELETE | `/api/experience/assignments/{id}` | Account Manager-owned scope |
| `experience.widget.get` | GET | `/api/users/{id}/agent-widgets/{agent_id}` | Assigned user scope |
| `catalog.voxServers.list` | GET | `/api/users/{owner_id}/infrastructure/vox-servers` | Client self; Account Manager self or direct Client; Ops Admin explicit Client or Account Manager |
| `catalog.transportDids.list` | GET | `/api/users/{owner_id}/infrastructure/transport-dids` | Same target scope; optional parent and direction filters |
| `catalog.partnerCredentials.list` | GET | `/api/users/{owner_id}/infrastructure/partner-credentials` | Same target scope |
| `vadProfile.list` | GET | `/api/vad-profiles/{owner_id}` | Ping-or-higher Client self; Account Manager self or direct Client; Ops Admin explicit Client or Account Manager |
| `vadProfile.get` | GET | `/api/vad-profiles/{owner_id}/{profile_id}` | Same profile target scope |
| `vadProfile.create` | POST | `/api/vad-profiles/{owner_id}` | Same profile target scope; mutation confirmation |
| `vadProfile.update` | PUT | `/api/vad-profiles/{owner_id}/{profile_id}` | Same profile target scope; current revision and mutation confirmation |
| `vadProfile.delete` | DELETE | `/api/vad-profiles/{owner_id}/{profile_id}` | Same profile target scope; non-initial profile, current revision, and mutation confirmation |
| `transport.credentials.list` | GET | `/api/users/{owner_id}/infrastructure/transport-credentials` | Pong Client self; Account Manager self or direct Client; Ops Admin explicit target |
| `transport.credentials.create` | POST | `/api/infrastructure/transport-credentials` | Pong Client or Account Manager creates a self-owned Exotel, Twilio, or Tata credential |
| `transport.credentials.test` | POST | `/api/users/{owner_id}/infrastructure/transport-credentials/{credential_id}/test` | Target-scoped accessible resource; returns status and checkedAt |
| `transport.credentials.delete` | DELETE | `/api/infrastructure/transport-credentials/{credential_id}` | Exact owner |
| `transport.dids.list` | GET | `/api/users/{owner_id}/infrastructure/transport-dids` | Same target scope as the credential list |
| `transport.dids.create` | POST | `/api/infrastructure/transport-credentials/{credential_id}/dids` | Exact parent owner |
| `transport.dids.test` | POST | `/api/users/{owner_id}/infrastructure/transport-credentials/{credential_id}/dids/{did_id}/test` | Target-scoped accessible resource; returns status and checkedAt |
| `transport.dids.delete` | DELETE | `/api/infrastructure/transport-credentials/{credential_id}/dids/{did_id}` | Exact parent owner |
| `partner.list` | GET | `/api/users/{owner_id}/infrastructure/partner-credentials` | Pong Client self; Account Manager self or direct Client; Ops Admin explicit target |
| `partner.create` | POST | `/api/infrastructure/partner-credentials` | Pong Client or Account Manager creates a self-owned Vertex or AI Studio credential |
| `partner.test` | POST | `/api/users/{owner_id}/infrastructure/partner-credentials/{credential_id}/test` | Target-scoped accessible resource; returns status and checkedAt |
| `partner.delete` | DELETE | `/api/infrastructure/partner-credentials/{credential_id}` | Exact owner |
| `runtime.voxServer.test` | POST | `/api/users/{owner_id}/infrastructure/vox-servers/{vox_server_id}/test` | Target-scoped granted runtime; returns status and checkedAt |
| `runtime.voxServer.grant` | PUT | `/api/infrastructure/vox-servers/{vox_server_id}/grants/{client_id}` | Account Manager delegates one usable runtime to a directly managed Pong Client |
| `runtime.voxServer.revoke` | DELETE | `/api/infrastructure/vox-servers/{vox_server_id}/grants/{client_id}` | Same Account Manager delegation scope |

## Inputs and lifecycle

Load the task's authoritative reference for its typed file and workflow:
[process creation](process-create.md), [batch mapping](batch.md),
[drip contacts/context/callbacks](drip.md), [infrastructure](infrastructure.md),
[VAD profiles](vad-profiles.md), [simulations](simulations.md),
or [Experience](experience.md). Pass absolute JSON file paths; do not use
literal JSON, shell quoting, or the human-only stdin `-` form.

## Response boundaries

Routine process/contact results omit pricing, CU configuration, callback
secrets, runtime URLs, and aggregate money. Drip creation alone returns the
callback secret once; handle it as prescribed in process creation.
Client process projections also omit infrastructure bindings and `agentId`.
Call detail requires both process and call ID. See [Calls](calls.md) for
pagination, correlation, expiry, and unsupported reporting questions.

Use structured errors. Authentication failures correspond to `401`, missing
tier/role to `403`, and missing/out-of-scope resources to the same `404`.
Visible resources with conflicting kind or lifecycle return conflict. Never
probe alternate routes or parse server text to bypass scope.

Pong excludes raw credential reads, global runtime registration, Ops-to-AM
grants, pricing, IAM administration, maintenance, SSH, and deployments.
