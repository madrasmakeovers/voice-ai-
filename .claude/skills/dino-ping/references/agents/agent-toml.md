# agent.toml Reference

## Full Example

```toml
name = "my-collection-agent"
description = "Hindi debt collection agent for Acme Corp."
model = "gemini-3.1-flash-live-preview"
voice = "Aoede"
language = "hi-IN"
temperature = 0.5

[[placeholders]]
key = "customer_name"
kind = "vox_text"
default = "John Doe"

[[placeholders]]
key = "emi_amount"
kind = "vox_currency"
default = "5000"

[[placeholders]]
key = "due_date"
kind = "vox_date"
default = "2026-04-01"
```

## Fields

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `name` | yes | string | Non-blank, single-line, 1–200 characters. |
| `description` | **yes** | string | Concise summary, ≤240 characters. Shown on the agents dashboard. |
| `model` | yes | string | Non-blank provider model ID, ≤256 characters, with no whitespace. It must match the partner credential selected when a process or Experience assignment is created. |
| `voice` | **yes** | string | Provider TTS voice (1–64 chars), e.g. `"Aoede"`, `"Puck"`. Must match the voice used to record the `src/` audio. |
| `language` | **yes** | string | BCP-47 from whitelist: `ta-IN`, `te-IN`, `kn-IN`, `ml-IN`, `hi-IN`, `en-IN`, `en-US`. |
| `temperature` | yes | float | 0.0 – 2.0. Lower = more consistent, higher = more varied. |
| `placeholders` | no | array | See Placeholders below. |

Do not maintain a remembered model catalog in an agent. Start from the value
emitted by the installed `dino agent scaffold`, then use a model supported by
the deployment's partner credential. The server rechecks provider
compatibility when the agent is bound to a process or Experience assignment.

## Tool Schemas Contract

Schema-backed agent tools are declared in one place:

- `flow.json` top-level `tools`, where each tool name maps to a `dispatch`
  block and an inline `schema`.

`next` is required as `flow.tools.next` with `"dispatch": { "kind": "system" }`.
Use `assets/flow-authoring/next-simple.schema.json` for flows without dispatch.
Use `assets/flow-authoring/next-dispatch.schema.json` when any outcome has
`"type": "dispatch"`. There is still only one model-facing tool named `next`;
the dispatch schema adds optional `selector`.

`memory`, when used, is declared as `flow.tools.memory` with
`"dispatch": { "kind": "flow_local", "handler": "memory" }` and an inline
schema.

Use descriptive tool names such as `record_outcome` and `call_summary`.

Do not put runtime tools in `agent.toml`.

## Placeholders

Each placeholder has:

| Field | Required | Description |
|-------|----------|-------------|
| `key` | yes | snake_case identifier referenced in `flow.json` as `[[key]]`. |
| `kind` | yes | One of `vox_text`, `vox_phone`, `vox_number`, `vox_currency`, `vox_date`. |
| `description` | no | Human-readable label for dashboards. |
| `default` | yes | Fallback value if not supplied at call time. Must pass the kind's format check. |

### Placeholder kinds

| Kind | Example default |
|------|-----------------|
| `vox_text`     | Any non-empty string. |
| `vox_phone`    | E.164 `+91…` (IN) or `+1…` (US), e.g. `+919876543210`. |
| `vox_number`   | Non-zero numeric value, optional thousands commas: `1,234.56`. Zero forms such as `0` and `-0.00` are rejected. |
| `vox_currency` | Non-zero amount with up to two decimal places, optional thousands commas: `1,500.00`. Zero forms such as `0` and `0.00` are rejected. |
| `vox_date`     | Strict ISO 8601 `YYYY-MM-DD`: `2026-03-22`. Forms like `22/03/2026` or `2026-3-22` are rejected. |

## Flow Cross-Validation

- Use `[[key]]` in `flow.json` for placeholders.
- Every `[[key]]` in the flow MUST be declared in `agent.toml`.
- Every declared placeholder MUST appear at least once in the flow.
- Include lifecycle/system tools in flow JSON; `next` must be declared under
  `flow.tools` but must not be listed in stage/post `toolPolicy.tools`.
- Schema-backed tools must be present in `flow.tools.<name>.schema`, then
  referenced from stage/post `toolPolicy.tools` when the stage or post may call
  them.
- Runtime `memory` must be declared in `flow.tools` with an inline schema and
  referenced from stage/post `toolPolicy.tools` when allowed.
