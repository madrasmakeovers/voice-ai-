---
name: dino-ping
docVersion: "1.0.0"
docUpdated: "2026-09-21"
description: >-
  Build, validate, publish, evolve, inspect, and deactivate Dino voice agents;
  author agent.toml, flow.json, lifecycle audio, and WASM integrations;
  inspect self-account billing, provision Account Manager Clients, and place
  Client-owned preview calls. Use dino-pong for account infrastructure,
  processes, general calls, and Experience; request administrator assistance for global administration.
---

# Dino Ping

## Start here: release and environment

Before deployment access, read [setup.md](references/setup.md) and complete
its exact skills/CLI release and workspace checks. Repeat each new session and
when the workspace or environment changes. Missing release metadata or a
mismatch blocks deployment access; a newer version is also incompatible.

Use `dino` for production and `dino-staging` for staging, with separate native
binaries and workspaces named `prod` and `staging`. All reference command
examples use `dino`; substitute `dino-staging` for staging. Invoke the exact
environment-specific binary name.

## Execution and approval

Invoke the installed executable directly with an argument vector and absolute
paths. No command interpreter, package script, MCP, or direct API HTTP.
Only the bootstrap's manifest/release downloads and approved installation may
use host installation tools. Local Git inspection and conflict resolution are
allowed inside an agent checkout. Obtain approval before changing local Git
state; use the installed CLI's download/publish commands for remote transfers.

Run `dino capabilities`. Require `ok: true`, `cliProtocolVersion: 1`, and
the intended operation in `data.operations`. For `readOnly: false`, require
`confirmationRequired: true`; otherwise stop.

Every such operation, including local scaffolding, rendering, audio,
integration builds/tests, and downloads, needs explicit approval for one
invocation:

1. Establish current state with read-only commands. For deployment access,
   also establish the actor and checked workspace/endpoints. Initial setup
   and path-only local operations do not require an authenticated account.
2. Show the exact operation, arguments, target paths, and side effect; include
   the workspace and endpoints when applicable. Ask for approval.
3. After an affirmative reply, invoke once with the global
   `--confirm-mutation <exact-operation>` advertised by capabilities.

Never infer approval from a broad goal or earlier plan. Changed arguments,
workspace, target, or a retry require fresh approval. Never prefill the flag
or add it to reads. Reference examples omit it unless illustrating an
already-approved invocation.

Parse the default JSON envelope: branch on `ok`, then `error.apiCode` when
present, `error.code`, `error.retryable`, and `error.details`. Do not scrape
messages or pass `--format`. Help and version-display are text exceptions;
use `release notes --json` for release history.

Use installed help, capabilities, results, and these references to resolve
deployed behavior. Do not inspect implementation, databases, logs, deployment
files, or internal routes unless the user asks for diagnosis/review/change.
Normal authoring may read agent files and skill assets. If the CLI cannot
establish a fact, report the gap; never invent flags or bypass it.

## Secrets and scope

For telephony experiments and test calls, use transport VAD
(`vox_vad_lite` or `vox_vad_enterprise`) with the call owner's standard Silero
profile. Discover and inspect the owner's initial profile, then pass its ID
explicitly. Use Partner VAD or widget client VAD only when the user explicitly
requests that exception; never select either as a fallback. For calls that
inherit their configuration, verify the assigned mode and profile before
launching. See [VAD profiles](../dino-pong/references/vad-profiles.md).

Agent-to-agent simulations use Partner VAD and have no transport-VAD profile option.
Follow [Simulations](../dino-pong/references/simulations.md) for their separate configuration and credential requirements.

Never print or return credentials, accept provider keys in chat, or store
secrets in skill/repository files, logs, or command arguments. Workspace
`.env` contains only `VOX_API_KEY` and `VOX_ENVIRONMENT`; provider credentials
use the private user store. Rotate chat-exposed keys through the secure
[audio credential workflow](references/agents/gemini-tts.md).

Ping owns agent lifecycle, self-account reads, narrow Account Manager Client
provisioning, local authoring, and Client-owned Preview. Ping Clients use
their onboarding allocations; they cannot create infrastructure or processes.
Read sibling Dino Pong for account resources/processes/Experience. Raw carrier
profiles, probes, real carrier test calls, pricing, IAM administration, and
global infrastructure require Dino Ops.

A Preview is real and potentially billable. Only a Client can call an active
agent they own, using their locked destination and ready Preview allocation.
An Account Manager configures the allocation; neither an Account Manager nor
Admin may place the Client's Preview. Read the complete Preview reference
before any Preview task. Never guess a destination or infer ownership.

## Read only the relevant task reference

For additional explanations, consult [DinoDial docs](https://docs.dinodial.ai) only as needed.
Docs do not override the manifest-selected release, installed CLI capabilities, or approval rules.

| Task | Read |
| --- | --- |
| Install, update, select environment, register workspace | [Setup](references/setup.md) |
| Create, download, publish, evolve, inspect, deactivate | [Agent lifecycle](references/agent-lifecycle.md) |
| Edit flow logic | [Flow authoring](references/flow-authoring.md), then its relevant subreference |
| Check the baseline or plan a future artifact upgrade | [Contract versions](references/contracts.md) |
| Interpret contract rejection or a call failure | [Contract and call errors](references/errors.md) |
| Edit agent configuration | [agent.toml](references/agents/agent-toml.md) |
| Start from a working agent | [Example index](references/examples.md); copy one suitable example |
| Show a flow diagram | [Local rendering](references/examples.md#optional-flow-preview); generate a PNG only when requested, never automatically |
| Generate lifecycle audio or import its provider credential | [Audio](references/agents/gemini-tts.md) |
| Build/package/test integration Components | [Integrations](references/integrations.md) |
| Self account, billing export, Client provisioning | [Accounts](references/accounts.md) |
| Preview allocation, call, status, history | [Preview](references/preview.md) |
| Discover transport fields/create empty templates | [Transport handoff](references/transport-testing.md) |
| Resolve CLI authorization or operation scope | [API surface](references/api-surface.md) |
| Interpret failures | [Recovery](references/recipes.md#handle-common-failures) |

Validate after material authoring edits and before publish. Preserve
integration IDs across versions; replace sample IDs before the first publish.
An out-of-scope `404` is final. Do not retry mutations without approval or
start a second interactive call after `409`.
