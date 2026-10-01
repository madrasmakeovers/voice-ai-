---
docVersion: "1.1.1"
docUpdated: "2026-09-12"
---

# Flow authoring

Read [SKILL.md](../SKILL.md) for execution and approval. Examples use production
`dino`; substitute `dino-staging` for staging. Agent files belong in the
workspace, never in the installed skill.

The model perceives, speaks, and reports `next(outcome, evidence)`; the
harness owns stage routing. A dispatch adds `selector`. Author the
conversation in `persona`, stage/post `instruction`, and concise routing
guidance.

## Build and validate

1. Read [agent.toml](agents/agent-toml.md) for configuration and
   [outcomes](flow-authoring/outcomes.md) for stage shape.
2. Scaffold with `dino agent scaffold --name <name>`, or copy one suitable
   [complete example](examples.md) into the workspace. Replace sample
   integration IDs with `dino integration new-id` before first publication.
3. Edit `agent.toml`, `flow.json`, lifecycle audio, and any integration
   source. A scaffold's `src/` still needs all four audio assets.
4. Build every integration referenced by the flow using
   [integrations](integrations.md). Artifacts belong in that agent's
   `plugins/`; no monorepo or external `wasm-tools` is needed.
5. Validate after each material edit:

   ```text
   dino agent validate --agent-dir <absolute-agent-dir>
   ```

   Require `ok: true` and `data.valid: true`. Resolve every config, flow,
   placeholder, audio, and plugin error before publication.
6. Render and inspect the complete graph, then follow the approved
   [publish workflow](agent-lifecycle.md).

On publication drift, download the current version to a new folder, reapply
the intended edit, validate, and publish. Do not overwrite a newer chain from
a stale local directory.

## Stage design

A stage is a decision checkpoint, not a spoken turn. Create one for a branch,
required gate (such as consent), tool-result boundary, or dispatch fork.
Otherwise keep the conversational step in the current instruction. A focused
objective usually needs 2–5 stages; larger graphs should reflect actual
decisions, not one node per question. F02 demonstrates this density.

Each stage has exactly `success` and `failure` outcomes:

| Intent | Outcome |
| --- | --- |
| Move to a stage | `route` with `target`; target instruction supplies guidance |
| Close the call | `end` with `next_instructions` |
| Close then run a post | `end_then_post` with `next_instructions` and required `post` |
| Select a subflow | `dispatch` with `routes`, `fallback`, and required `max_misses` (1–5) |

Read [dispatch](flow-authoring/dispatch.md) only for selector routing.
A failure outcome successfully takes a failure edge; malformed arguments or
a disallowed tool reject the invocation and keep the current stage.

## Required declarations

- Set root `contractVersion` to the selected environment's supported flow
  contract. Read [contract versions](contracts.md) before upgrading an old flow.
- For a new flow, use unique readable stage keys throughout or UUID keys throughout.
  CLI and MCP agent creation use the same conversion from readable keys to runtime UUIDs.
  The conversion preserves readable labels in each stage's `name` field.
- For an existing UUID flow, preserve its stage keys. Give each new stage a fresh UUID v7 key and a readable `name`.
- Set `start` and route/dispatch targets to existing stage keys. Mixed readable and UUID stage keys fail validation.
- Validation does not save generated UUIDs to the source file. CLI publishing saves the converted flow before submission.
- Declare exactly one system `next` tool. Copy
  [next-simple.schema.json](../assets/flow-authoring/next-simple.schema.json),
  or [next-dispatch.schema.json](../assets/flow-authoring/next-dispatch.schema.json)
  if any outcome dispatches. Keep `outcome.enum` as `success`/`failure`.
- A tool's `flow.tools` key is its name. Use a `dispatch` block:
  system for `next`, `flow_local` with `handler` for memory/capture, or
  `integration` with `integrationId` and `operation`.
- Stage/post `toolPolicy.tools` permits declared non-`next` tools.
  `next` is always available and must not be listed there.
- Put shared rejection text in `guidance.notAllowed` and
  `guidance.unknownTool`. Put per-tool gates under `policy.invocation`
  and deadlines/stale-result behavior under `policy.async`.
- Typed `next`, `memory`, and integration validation own argument
  corrections. Do not add `invalidOutcome` or their
  `policy.invocation.arguments`. Capture retains
  `policy.invocation.arguments.invalid`.
- Ordinary tools should declare repeat `once` and concurrency `reject`;
  relax them only where repetition/overlap is safe. Repeated memory writes
  and lifecycle `next` are deliberate exceptions.
- Keep runtime guidance short and imperative. Define stage-specific success
  and failure conditions in its instruction.
- Define each integration once under its stable UUIDv7 registry key, repeat
  that ID in `id`, and declare unique non-empty `operations`. Tools refer
  to that ID and a declared operation. IDs remain stable across evolves.
  Use [integration-tool.md](flow-authoring/integration-tool.md) for the
  complete registry and policy shape.

## Memory and reporting

Use [memory](flow-authoring/flow-local-tools.md) when facts must be recalled
later. For 3+ collected facts, allow memory on the collection stage and
instruct one write per fact as it arrives. Capture is a reporting sink;
the model cannot read it back. A wrap-up post typically reads memory,
relays the result through an integration, then captures the disposition.

Use `mark_disposition` for normal terminal reporting. Use a separate
`mark_premature_close` through `onPrematureTransportClose` for disconnects.
Generate `stageReached` from stage keys. Agree the domain-specific final
`disposition` enum with the user; premature-close reporting uses its own
signal enum such as `lastSignal`. Describe every tool and field concisely.

## Fix validation errors

| Problem | Fix |
| --- | --- |
| Unknown field/tool shape | Use the typed `dispatch` shape; remove obsolete fields |
| Empty required text | Supply persona, instruction, names, keys, and guidance |
| Missing/unreachable stage | Correct `start`/targets or remove unused stages |
| No terminal path | Give every route/loop a way to reach an end outcome |
| Placeholder mismatch | Keep flow `[[key]]` and agent declarations consistent |
| Missing audio | Supply greeting, error, time_limit, idle_warning Ogg Opus files |
| Missing/stale Component | Rebuild the agent-owned source, then validate |

Use the validator's structured details for diagnosis; diagnostic wording is
not a stable machine interface.
