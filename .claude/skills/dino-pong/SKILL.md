---
name: dino-pong
docVersion: "1.2.0"
docUpdated: "2026-09-21"
description: >-
  Create and operate Dino batch, drip, and inbound processes; inspect process
  calls; run two-agent simulations; manage account-owned infrastructure; assign Experience and widgets.
  Use for ongoing call orchestration. Requires sibling dino-ping for shared
  execution policy and agent authoring; one Client preview call belongs there.
---

# Dino Pong

## Required first read

Read [Dino Ping](../dino-ping/SKILL.md) first and complete its release,
workspace, capability, JSON, secret-handling, and per-invocation approval
gates. Missing Ping is an incomplete installation: stop and reinstall the
manifest-selected bundle. Do not reconstruct its policy.

Use `dino` for production and `dino-staging` for staging. All references show
`dino`; substitute the selected executable throughout. Keep both environments'
skills, binaries, workspaces, and account contexts separate.

Run `dino account get` to establish actor role and tier. Read only the task
reference below; do not load the whole reference directory. Command examples
omit confirmation flags intentionally: obtain the inherited exact-invocation
approval, then add the capability's advertised `--confirm-mutation` value.

## Select the workflow

For additional explanations, consult [DinoDial docs](https://docs.dinodial.ai) only as needed.
Apply Ping's release and execution rules if the docs differ.

| User needs | Read |
| --- | --- |
| Choose batch, drip, inbound, or interactive calling | [Workflow selection](references/recipes.md) |
| Create any process; select owner, resources, and call policy | [Process creation](references/process-create.md) |
| Import, dispatch, pause, retry, export, or discard a batch | [Batch](references/batch.md) |
| Enqueue contacts, control drip, reconcile callbacks, supply private context | [Drip](references/drip.md) |
| Read processes, calls, post-tools, or change integrations | [Calls](references/calls.md) |
| Manage owned credentials/DIDs or delegate a runtime | [Infrastructure](references/infrastructure.md) |
| Select or manage speech-detection profiles | [VAD profiles](references/vad-profiles.md) |
| Assign, update, clone, disable Experience or fetch widgets | [Experience](references/experience.md) |
| Connect two Dino agents without telephony and inspect their Lens reports | [Simulations](references/simulations.md) |
| Resolve an operation name, authorization, or response boundary | [API surface](references/api-surface.md) |

## Ownership boundary

A Pong Client acts only for themself. An Account Manager may create processes
for themself or a directly managed Pong Client. Ops Admin targeting requires
an explicit permitted target. A Ping Client cannot create processes or manage Pong infrastructure.
[VAD profiles](references/vad-profiles.md) also support Ping-tier accounts.

Drip lifecycle, contact insertion, and callback reconciliation require the
exact owner, even when a manager created the process. Credential writes are
self-only. Experience assignment is Account Manager-only. Never switch
identity implicitly or mix resources from different owners.

Real call dispatch requires approved destinations. Stop on missing authority
or unavailable public CLI facts; do not infer them from private infrastructure.
Raw credentials, global runtime administration, pricing, recovery, IAM, SSH,
and deployment operations belong to Dino Ops.
