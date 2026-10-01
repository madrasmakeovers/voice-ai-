# The `integration` tool (flow side)

An integration lets a stage call an agent-owned WASM Component. The flow
authors one plugin definition and lets any number of tools reference its
declared operations.

## Registry and tool declaration

Generate one stable UUIDv7 for the plugin with `dino integration new-id`. Keep
that ID when evolving the same logical plugin.

```jsonc
{
  "integrations": {
    "019f1dd1-7d33-702a-bf34-0087b877e691": {
      "id": "019f1dd1-7d33-702a-bf34-0087b877e691",
      "label": "Demo CRM",
      "pluginRef": "demo_crm_embedded.wasm",
      "operations": ["lookup_customer", "send_message"],
      "configuration": { "baseUrl": "https://crm.example" }
    }
  },
  "tools": {
    "lookup_customer": {
      "dispatch": {
        "kind": "integration",
        "integrationId": "019f1dd1-7d33-702a-bf34-0087b877e691",
        "operation": "lookup_customer"
      },
      "policy": {
        "invocation": {
          "repeat": {
            "mode": "once",
            "exceeded": "This stage has already used this tool."
          },
          "concurrency": {
            "mode": "reject",
            "inFlight": "Wait for the current integration run."
          }
        },
        "async": {
          "mode": "wait_for_result",
          "timeout": {
            "secs": 20
          },
          "staleResult": { "mode": "drop" }
        },
        "integrationHostFailureGuidance": {
          "timedOut": "That lookup did not finish in time. Continue safely.",
          "unavailable": "The lookup service is temporarily unavailable. Continue safely.",
          "sandboxViolation": "The lookup could not complete safely. Continue safely.",
          "internal": "The lookup could not be completed. Continue safely."
        }
      },
      "schema": {
        "description": "Look up a customer record by unique ID.",
        "parameters": {
          "type": "object",
          "properties": {
            "unique_id": { "type": "string" }
          },
          "required": ["unique_id"]
        }
      }
    }
  }
}
```

The registry key must equal the definition's `id`. `operations` must be
non-empty and unique. Every integration tool must reference an existing entry
and one operation declared by it. Every registry entry must be referenced by
at least one tool. A flow with no integrations may omit the registry or use an
empty object.

One plugin means one integration ID, one catalogue row, one call binding, and
one `<integration-id>.wasm` file. Do not create one definition or binary per
operation. There is no `kind`, adapter selector, or native-integration branch.

`label` is for humans and is not an identity. `pluginRef` is a flat packaged
`.wasm` filename. `configuration` is bounded, non-secret JSON shared by every
operation of the plugin; host-owned runtime settings and `pluginRef` are not
allowed inside it.

## Availability and asynchronous policy

List a tool in a stage or post's `toolPolicy.tools` only where the model may
call it. Flow-level `guidance.notAllowed` owns availability rejection.
`policy.invocation` owns argument, repeat, and concurrency gates;
`policy.async` owns the local operation deadline and stale-result behavior.
An integration deliberately has no `invocation.arguments.invalid`: the
Component's required `validate()` function owns argument rejection text, and
Dino passes that rejection to the model.

Use `wait_for_result` when the conversation needs the result. The tool call is
answered after validation and the execution result is injected later. Tell the
model to wait for and use that result. Use `fire_and_forget` when only the side
effect matters; Dino answers after validation but does not inject the eventual
execution result.

A policy rejection means the plugin did not run. It is distinct from a plugin
validation rejection, a failed execution, or a `next` failure outcome.

New ordinary tools default to `policy.invocation.repeat.mode: "once"` and
`policy.invocation.concurrency.mode: "reject"`. These are safe authoring defaults rather than
hardcoded runtime rules; declare a different mode explicitly when an operation is
safe to repeat or overlap.

The nesting is required: `repeat` and `concurrency` live under `invocation`,
while `async` and `integrationHostFailureGuidance` are siblings of
`invocation`. `timeout.secs` accepts 1–300 seconds and contains no guidance.
It is one Dino-local operation deadline: in `wait_for_result` it spans
validation through execution-result delivery; in `fire_and_forget` it spans
validation only. It does not change the guest deadlines selected by runtime
policy; the bundled baseline uses 250 ms validation and 30 second execution.

Every integration tool must author all four host-failure messages:
`timedOut`, `unavailable`, `sandboxViolation`, and `internal`. They are used
only when the plugin cannot return normally. A plugin `Err(IntegrationError)`
uses the plugin's exact message instead.

## What the model receives

`validate` and `execute` both return
`Result<serde_json::Value, IntegrationError>`, but they use different delivery
paths:

| Guest result | Model delivery |
|---|---|
| Validation `Ok(null)` | original function response `{ "success": true }` |
| Validation `Ok("message")` | original function response `{ "success": true, "message": "message" }` |
| Validation `Ok(other JSON)` | original function response `{ "success": true, "payload": <exact JSON> }` |
| Validation `Err(message)` | original function error with the exact plugin message |
| Execution `Ok("text")` | `text` injected asynchronously for `wait_for_result` |
| Execution `Ok(other JSON)` | compact complete JSON injected as text for `wait_for_result` |
| Execution `Err(message)` | exact plugin message injected for `wait_for_result` |

Validation is never delivered as realtime text. `fire_and_forget` persists the
execution outcome without injecting it. Host failures use the corresponding
flow-authored guidance through the same phase-specific path: a validation host
failure rejects the original function call; an execution host failure is
injected as text for `wait_for_result`.

Registration is automatic during publish. Base publishes the flow
registry and one Component copy per integration ID as one immutable agent
version. Publication prepares the final immutable Component before that version
is callable, and service startup prepares every registered Component before
readiness. See `wasm-plugin.md` for authoring, ABI, sandbox, metering, and local
testing.
