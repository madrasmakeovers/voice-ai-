---
docVersion: "1.0.0"
docUpdated: "2026-09-10"
---

# Dino Ping CLI and API surface

`dino` (production) and `dino-staging` (staging) are the native interfaces. It sends the IAM key from the
selected workspace as `X-Api-Key` to the public API and returns one JSON
envelope. Ping is the minimum tier for the routes below; Pong and Ops inherit
them.

The global `--format json|text` argument is a human and pipeline affordance.
`json` is the default and the only agent-facing contract. An agent must not
pass `--format`. Text mode changes the rendering and moves failures to
stderr; it does not change any route, scope, or error code below.

Every `<JSON_PATH>` argument accepts `-` for standard input. Agents keep
passing absolute paths. `credentials import --input` and every stored credential
create input require an absolute private file. Secrets must not arrive through a
pipe.

| CLI operation | Method | Public route | Scope |
| --- | --- | --- | --- |
| `account.get` | GET | Command `/api/me` | Authenticated actor |
| `account.billingStatement` | GET | Command `/api/me/statement.csv` | Billable Client or Account Manager |
| `account.client.provision` | POST | Command `/api/account/clients` | Account Manager creates a directly managed Client with a same-region Preview destination, requested Widget concurrency, and resource arrays; exact retries use the same docket |
| `account.clientPreview.set` | PUT | Command `/api/iam/clients/{client_id}/preview-destination` | Account Manager for a directly managed, same-region Client |
| `account.previewAllocations.list` | GET | Command `/api/preview-allocations` or `/api/account/clients/{client_id}/preview-allocations` | Client self; Account Manager for one directly managed Client |
| `account.previewAllocation.replace` | PUT | Command `/api/account/clients/{client_id}/preview-allocations/{allocation_id}` | Account Manager atomically replaces one directly managed Client's complete Preview allocation; result contains the new `allocationId` |
| `agent.list` | GET | Base `/api/agents` | Visible catalogue |
| `agent.get` | GET | Base `/api/agents/{id}` | Visible chain/version |
| `agent.history` | GET | Base `/api/agents/{genesis_id}/history` | Visible chain |
| `agent.download` | GET, POST | Base `/api/agents/{id}/git`, `/api/agents/{id}/git/info/refs`, `/api/agents/{id}/git/git-upload-pack` | Owner, current directly managing Account Manager, or Ops root; native Git clone/fetch |
| `agent.publish` (new) | POST | Base `/api/agents/repositories` followed by native Git push | Reserve one caller-owned repository with a stable `genesisId` |
| `agent.publish` | GET, POST | Base `/api/agents/{id}/git`, `/api/agents/{id}/git/info/refs`, `/api/agents/{id}/git/git-receive-pack` | Owner, current directly managing Account Manager, or Ops root; commit locally and push to `published` |
| `agent.deactivate` | POST | Base `/api/agents/{genesis_id}/deactivate` | Owner, current directly managing Account Manager, or Ops root |
| `agent.previewCall` | POST | Command `/api/agents/{agent_id}/preview-calls` | Client supplies one active docket ID and one selected DID, partner, and Dino runtime from that docket |
| `agent.previewCalls.list` | GET | Command `/api/preview-calls` | Client self; Account Manager for one directly managed Client; cursor pagination with a limit from 1 to 100 |
| `agent.previewStatus` | GET | Command `/api/preview-calls/{dd_id}` | Exact Client Preview owner |

## Preview data contract

The allocation catalog contains `allocationId`, `previewPhoneNumber`, `dids`,
`partners`, and `voxServers`. Each resource contains `id`, safe metadata,
health evidence, and availability. The DID also contains
`onDemandAvailable`. An unavailable allocation stays visible so the Account
Manager can replace the complete bundle. The catalog never returns a
credential payload.

Allocation replacement returns only the new Client `allocationId`
after the transaction commits. It does not perform a post-commit catalog read.
Use `account.previewAllocations.list` as a separate read-only refresh.

Preview history returns `items` and an optional `nextCursor`. Each item contains
`ddId`, optional `callId`, `agentId`, `agentName`, `status`, `createdAt`,
optional `durationMs`, `postTools`, and the current optional `lensUrl`. A history
read does not create or renew a Lens link.

## Server route without a CLI mapping

Command exposes `POST /api/calls/{call_id}/lens-links` to the exact owner of an
answered archived call. The request is `{"validForDays": <1-30>}`. The response
contains `callId`, `lensUrl`, and `expiresAt`; its validity begins when the
request is created and cannot exceed 30 days.

The current CLI does not advertise an operation for this route. Skills must
not use direct HTTP as a fallback. Report that fresh-link issuance is
unavailable through the installed CLI until a capability-backed operation is
added.

The following do not call a Dino deployment. `agent.generateAudio` calls the
configured Gemini provider, and `integration.build` may let Cargo resolve
dependencies:

| CLI operation | Purpose |
| --- | --- |
| `version` | Report build/version metadata |
| `version.check` | Compare the installed CLI with the exact release selected by the endpoint manifest for the selected executable's environment |
| `release.notes` | Read the complete bundled release history and authors offline |
| `capabilities` | Discover protocol version and implemented operations |
| `credentials.status` | Inspect secret-free persistent provider credential status |
| `credentials.import` | Import or explicitly replace a provider key from an absolute private file in the user-scoped Dino configuration store |
| `transport.providers` | List local telephony profile fields and supported checks |
| `transport.scaffold` | Create private provider-specific `profile.json` and `call.json` templates |
| `transport.validate` | Validate a private local profile without network access |
| `transport.probe` | Test supported carrier credentials and DID settings without a call; secret-bearing execution belongs to Dino Ops |
| `transport.testCall` | Send one potentially billable carrier test-call request through Dino Ops after exact approval |
| `workspace.init` | Create `.env` and `agents/` without overwriting |
| `workspace.check` | Validate paths, typed key, endpoint configuration, and structured registration/current status |
| `workspace.use` | Register and activate a canonical workspace path, or switch by name |
| `workspace.current` | Read the active workspace name and path |
| `workspace.list` | List registered workspace names and paths |
| `workspace.remove` | Remove a registration and clear it if active |
| `agent.scaffold` | Create the current authoring skeleton in the workspace |
| `agent.validate` | Run the same typed config and flow validation used by publication |
| `agent.render` | Render the complete authored flow to a GitHub-ready PNG |
| `agent.generateAudio` | Generate selected transactional Ogg Opus assets |
| `integration.newId` | Generate a UUIDv7 integration ID |
| `integration.scaffold` | Create agent-owned Rust or prebuilt plugin authoring metadata |
| `integration.build` | Build, verify, and package the built-in Rust adapter |
| `integration.verify` | Validate any language's Component against the Dino WIT |
| `integration.test` | Validate and execute one Component operation with an explicit target runtime policy |
| `integration.package` | Verify and copy a component plus receipt under `agent/plugins` |

## Machine contract

Complete the exact environment-specific release gate in `../SKILL.md`, run
`dino version check` (or `dino-staging version check`), then discover
operations with `dino capabilities`. Protocol version 1 uses:

```json
{
  "ok": true,
  "cliProtocolVersion": 1,
  "operation": "agent.validate",
  "data": {}
}
```

Failures set `ok` to false and provide a stable broad `error.code`, message,
`retryable`, optional structured details, and optional `apiCode` containing a
more specific code supplied by a Dino API. Internal causes are never
serialized. Exit codes distinguish input, authentication, authorization,
not-found, conflict, precondition, network, server, and internal failures.
Consumers must use the JSON fields rather than parsing diagnostics.

Every operation advertised with `readOnly: false` also advertises
`confirmationRequired: true`. It runs only when the global
`--confirm-mutation` value exactly matches the operation name. Missing or
mismatched confirmation returns `precondition_failed` with machine-readable
approval details before any mutation. Agent policy requires explicit human
approval before supplying that flag.

`dino release notes` is the human-readable exception. Agents must use
`dino release notes --json`, which returns the normal `release.notes` envelope.

## Ownership and visibility

Publication captures the authenticated user as immutable chain owner; requests
never accept an owner ID. An Account Manager can read, evolve, and deactivate agents owned by current
directly managed Clients. Client transfer moves this authority to the new
Account Manager. Ops-tier Admin is the
root exception. Direct reads outside catalogue scope return `404`.

Ping Preview uses one active Client-owned docket that refers to one or more DIDs,
partner credentials, and Dino runtimes owned by or granted to the provisioning
Account Manager. Client onboarding accepts one or more source IDs of each kind.
The read-only allocation catalog exposes the allocation ID, locked
destination, source IDs, safe metadata, health evidence, and readiness, but no
credentials. The Account Manager replaces the complete allocation atomically.

Only a Client can place a Preview call. The request supplies one Client docket
ID and one resource ID of each kind. It never supplies a phone number.
Command validates that the selected resources belong to the docket. The agent must
be active and owned by the Client. An Account Manager can list a directly
managed Client's allocations and history but cannot place a Preview call. An
Admin cannot use the Ping Preview surface. One user-wide flight lock spans Ping
Preview, Experience telephony, and widgets.

Client provisioning is the narrow Account Manager exception to general IAM
administration. It creates a directly managed Client, default Ping access,
default regional prepaid Wallet account with zero opening balance and
overdraft, requested Widget concurrency, fixed same-region Preview destination,
one Preview allocation, and password-setup delivery. An exact retry must use
the same identity, concurrency, and resource bundle. It never creates or returns an
API key.

Ping-tier accounts can manage [VAD profiles](../../dino-pong/references/vad-profiles.md) under their authorized owner scope.
The sibling Pong [API surface](../../dino-pong/references/api-surface.md) lists these profile operations.

Account-owned infrastructure operations belong to the sibling Dino Pong skill.
Its create inputs use private files and responses never return secrets.
Ping does not expose runtime registry controls, general process management,
pricing configuration, Experience assignment, general IAM administration,
Lens maintenance, or deployment access.

The `transport.*` names make the inherited local CLI contract discoverable.
Ping can list provider fields and create empty templates. Secret-bearing
profile population, probes, and carrier test calls belong to Dino Ops. Read
[transport-testing.md](transport-testing.md) for the handoff boundary.
