---
docVersion: "4.1.0"
docUpdated: "2026-09-09"
---

# WASM integration plugins

Commands use `dino` for production; substitute `dino-staging` for staging.
Apply the [release and approval gates](../../SKILL.md) before execution.

Dino integrations are agent-owned WebAssembly Components. One plugin may
implement many operations, but it has one integration ID, one configuration,
one call binding, one catalogue row, and one immutable Component copy per
agent version.

The model sees a normal flow tool. The tool dispatch carries the integration
ID and one operation. The integrations service resolves the plugin binding,
checks that the wire operation is declared, records the run, and executes the
Component in a bounded Wasmtime sandbox.

## End-to-end workflow

For Rust:

```text
dino integration scaffold --agent-dir <agent> --name customer-lookup --language rust --operation lookup_customer --operation send_message
rustup target add wasm32-unknown-unknown
dino integration build --agent-dir <agent> --name customer-lookup
dino integration verify --component <artifact-from-build-result>
dino --confirm-mutation integration.test integration test --policy <integrations-runtime.toml> --component <artifact-from-build-result> --operation lookup_customer --args <args.json> --record <record.json> --context <context.json> --config <config.json>
dino agent validate --agent-dir <agent>
```

The scaffold creates one manifest and one flow registry definition containing
all repeated `--operation` values. It emits one tool dispatch per operation,
all pointing to the same integration ID. The Rust adapter invokes Cargo
directly for `wasm32-unknown-unknown`, wraps the module as a Component
in-process, and verifies it. It does not invoke a shell or external
`wasm-tools`.

For another language, produce an ABI-compatible Component with its trusted
toolchain, then use the prebuilt boundary:

```text
dino integration scaffold --agent-dir <agent> --name customer-lookup --language prebuilt --operation lookup_customer
dino integration package --agent-dir <agent> --name customer-lookup --component <component.wasm>
dino integration verify --component <artifact-returned-by-package>
dino agent validate --agent-dir <agent>
```

Never put an executable, command, or argument list in `vox-plugin.toml`.

Packaging embeds the manifest's supported contract version in the WASM Component.
Uploads and runtime loading require this declaration, including for pure plugins without host imports.
An existing unsupported declaration is rejected, not overwritten. Rebuild from the correct source contract.

## Agent layout and manifest

```text
<agent>/
├── agent.toml
├── flow.json
├── integrations/
│   └── customer-lookup/
│       ├── vox-plugin.toml
│       ├── Cargo.toml
│       └── src/lib.rs
└── plugins/
    ├── customer-lookup.wasm
    └── customer-lookup.build.json
```

The Rust source depends on `dino-sdk`. The SDK owns WIT generation,
the raw JSON boundary, and host-capability bindings, so plugin code should not
invoke `wit_bindgen::generate!` or vendor a WIT copy. The CLI-generated
manifest pins SDK candidate `0.2.0-rc.1`, which is not yet published:

```toml
dino-sdk = { version = "=0.2.0-rc.1", features = ["guest"] }
```

The default SDK contains shared types and validation. The `guest` feature adds plugin exports and host-capability bindings.
Keep that public source in distributed agents. Before SDK publication, local CLI development requires `DINO_SDK_PATH` (or `VOX_INTEGRATION_SDK_PATH`) to reference the absolute `crates/sdk` directory.
Use that override only for SDK development and repository tests. It does not prove public installation compatibility.

```toml
schema_version = 1
name = "customer-lookup"
language = "rust"
abi = "vox:integration/plugin@0.2.0"
plugin_ref = "customer-lookup.wasm"
operations = ["lookup_customer", "send_message"]
```

- `schema_version` is `1`.
- `name` is the safe local source-directory identity.
- `language` is `rust` or `prebuilt`.
- `abi` is exactly `vox:integration/plugin@0.2.0`.
- `plugin_ref` is a flat `.wasm` filename, never a path.
- `operations` is non-empty and unique.

Build/package writes the verified Component and deterministic receipt under
the same agent's `plugins/` directory. The receipt records the ABI, language,
plugin reference, sorted source SHA-256, component SHA-256, and byte count. It
has no timestamp. Do not commit generated `plugins/` output to public skills.

## Flow declaration

The plugin lives once in the flow registry:

```json
"integrations": {
  "019f19a1-36ce-7f28-90e4-261426d1e27c": {
    "id": "019f19a1-36ce-7f28-90e4-261426d1e27c",
    "label": "Customer lookup",
    "pluginRef": "customer-lookup.wasm",
    "operations": ["lookup_customer", "send_message"],
    "configuration": { "baseUrl": "https://crm.example" }
  }
}
```

Each model tool references it and selects one operation:

```json
"dispatch": {
  "kind": "integration",
  "integrationId": "019f19a1-36ce-7f28-90e4-261426d1e27c",
  "operation": "lookup_customer"
}
```

Generate the ID once with `dino integration new-id`. Keep it while evolving the
same logical plugin. Allocate a new ID for a different plugin. See
`integration-tool.md` for the complete tool policy.

## Typed guest API

Implement the SDK trait and export it once:

```rust
use serde::Deserialize;
use serde_json::{json, Value};
use dino_sdk::{Integration, IntegrationError, Request};

struct CustomerLookup;

#[derive(Deserialize)]
struct ContactRecord {
    unique_id: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LookupArguments {
    include_history: bool,
}

impl Integration for CustomerLookup {
    fn validate(request: &Request) -> Result<Value, IntegrationError> {
        if request.tool.operation().as_str() != "lookup_customer" {
            return Err(IntegrationError::new("unknown operation"));
        }
        let record: ContactRecord = serde_json::from_value(Value::Object(request.record.as_map().clone()))
            .map_err(IntegrationError::Encoding)?;
        if record.unique_id.trim().is_empty() {
            return Err(IntegrationError::new("uniqueId is required"));
        }
        let _: LookupArguments = serde_json::from_value(Value::Object(request.tool.fields().clone()))
            .map_err(IntegrationError::Encoding)?;
        Ok(Value::Null)
    }

    fn execute(request: Request) -> Result<serde_json::Value, IntegrationError> {
        Self::validate(&request)?;
        let record: ContactRecord = serde_json::from_value(request.record.into_value())
            .map_err(IntegrationError::Encoding)?;
        let arguments: LookupArguments = serde_json::from_value(Value::Object(request.tool.fields().clone()))
            .map_err(IntegrationError::Encoding)?;
        Ok(json!({
            "uniqueId": record.unique_id,
            "includeHistory": arguments.include_history,
            "found": true
        }))
    }
}

dino_sdk::export_integration!(CustomerLookup);
```

`Request` exposes typed `execution_id`, `call_id`, optional `phone_number`, and
JSON-object wrappers named `record`, `tool`, `context`, and `configuration`.
`tool.operation()` is the flow-selected operation. Decode plugin-owned business
types with standard Serde, as shown above. When you own a payload, pass
`payload.into_value()` to `serde_json::from_value` to avoid cloning its map. There is
no Dino-prefixed context namespace and the plugin does not receive its
integration ID or agent IDs.

The API caller supplies private call data as `plugin_contexts`, keyed by
integration ID. The plugin receives only its addressed object as `context`.
The host supplies Batch and Drip `unique_id` plus contact placeholders in the
trusted `record` object. Unavailable record fields are omitted; `record` itself
is always an object. Model-visible placeholders are not copied into the plugin
context. `configuration` is the flow registry entry's shared, non-secret
configuration object. Tool fields are untrusted model input.

Use `request.execution_id` as the correlation/idempotency token for external
side effects and retain `request.call_id` in operational traces.

## ABI 0.1

The canonical SDK WIT package is `vox:integration@0.2.0`; the implemented world
is reported as `vox:integration/plugin@0.2.0`.

The SDK owns the canonical WIT; do not copy it into plugin sources. The world
imports `builtins` and exports `validate` and `execute`, each accepting the
request above and returning JSON data or an error string.

`dino integration verify` requires Component encoding, exact exports, and only
the namespaced builtins with the expected signatures. Component bytes are also
size-bounded.

## Validation and execution

Both methods return `Result<serde_json::Value, IntegrationError>`. One run has
two fresh stores:

1. `validate` checks the operation, record, tool fields, context, configuration, and
   local preconditions. It must not perform external side effects. `Ok` accepts
   the invocation; `Err` rejects it with the plugin's exact message.
2. `execute` performs the operation and returns one JSON value or a safe error.

Guest memory is not shared between phases or runs. `execute` must defend its
inputs independently. The compiled Component may be cached, but an instance is
never reused. Durable state belongs in an external system.

Validation success closes the original model function call exactly once:

| `validate` return | Successful function-response output |
|---|---|
| `Ok(Value::Null)` | `{ "success": true }` |
| `Ok(json!("Arguments accepted."))` | `{ "success": true, "message": "Arguments accepted." }` |
| `Ok(other non-null JSON)` | `{ "success": true, "payload": <exact JSON> }` |

Dino owns the outer `success` flag. Validation is never sent through realtime
text injection. A validation `Err(message)` becomes the original function
response's exact error. It is an ordinary plugin rejection, so flow-authored
host-failure guidance does not replace it.

For `wait_for_result`, execution uses the asynchronous text-injection path:

- `Ok(JSON string)` injects the string's exact contents;
- `Ok(any other JSON)` injects the compact serialization of the complete value;
- `Err(message)` injects the plugin's exact message.

Dino does not unwrap a field such as `value` and does not add integration-specific
wording. A conversational operation should therefore return a clear sentence,
for example `json!("The random number is 15922.")`; a bare `json!(15922)` is
valid but injects only `15922`. `fire_and_forget` persists the execution outcome
without sending it to the model.

## Builtins, sandboxing, and metering

Guest code may call only `builtins::http`, `builtins::log`, and
`builtins::hmac_sha256`. There is no sleep builtin. HTTP is HTTPS-only and
rejects loopback, private, link-local, reserved, and other non-public
destinations. DNS resolution and connection use the same deadline; redirects,
system proxies, and automatic retries are disabled. Logging and HMAC are
available in both phases; HTTP is denied during side-effect-free validation and
available only during execution.

Everything that runs inside an integration is metered:

- every run pays versioned base fuel;
- Wasmtime meters guest instructions in validation and execution;
- each builtin deducts a fixed minimum plus byte-sensitive fuel from the same
  phase store;
- successful HTTP response bytes are charged too;
- checked arithmetic fails closed instead of underbilling;
- phase fuel is converted to integration CU with the persisted metering
  revision.

Execution history records phase fuel, total CU, metering revision, and the
runtime descriptor. Read the descriptor from `integration test`; do not infer
runtime or Wasmtime versions from this document.

The selected versioned runtime policy owns the sandbox boundaries. The skill
includes `references/integrations-runtime.toml` as its authoring baseline. Get
the exact non-secret target policy from the deployment operator and pass it to
`dino integration test` before publication. The result reports all effective
limits under `data.sandbox.limits`.

The authoring baseline is:

| Boundary | Limit |
| --- | ---: |
| Component upload | 1 MiB |
| Fuel | 500,000 per validation or execution phase |
| Guest memory | 4 MiB per fresh store |
| Guest table elements | 128 per fresh store |
| Combined request fields | 32 KiB |
| Result JSON | 16 KiB |
| HTTPS request | 16 KiB |
| HTTPS response | 16 KiB |
| One HTTPS timeout | at most 10 seconds and remaining execution time |
| One guest log entry | 2 KiB |
| Validation deadline | 250 ms |
| Execution deadline | 30 s |
| Authored flow operation timeout | 1–300 s |

The policy controls these limits and the HMAC budget. An operator can set a
lower execution limit for one agent genesis. The authored flow operation
timeout remains a separate 1–300 second value.

The combined request budget covers execution/call IDs, phone, record, tool,
context, and configuration. Fuel bounds compute; epoch interruption
and capability deadlines bound wall time. The authored 1–300 second value is a
separate Dino-local operation deadline. For `wait_for_result`, it spans guest
validation, guest execution, and result delivery; for `fire_and_forget`, it ends
after validation. It does not raise the selected guest deadlines.

Component preparation is excluded from guest deadlines. Publication and startup
prepare Components before readiness; cold paths compile once per path. Each
phase starts its own deadline after preparation and uses a fresh store.

## Durable execution history and delivery

Every claimed `integration_run_id` reaches `rejected`, `succeeded`, or `failed`,
including reconciliation after interruption. History associates the call,
integration, operation, outcome, metering, and runtime descriptor.

Execution is at-most-once by integration run ID. Duplicate frames do not
re-execute or replay a stored result. A disconnected wait-mode result can be
lost; history is inspection, not a delivery queue. Never automatically retry a
timed-out mutation because a timeout does not prove the side effect did not
happen.

`wait_for_result` answers the original function call after validation, then
injects the execution outcome. `fire_and_forget` sends only the validation
function response; the outcome is still metered and recorded.

## Flow policy and failure ownership

The flow tool keeps repeat and concurrency controls under `policy.invocation`,
async mode and the local operation deadline under `policy.async`, and four
required host-only messages under `policy.integrationHostFailureGuidance`. Use
the conservative `once`/`reject` invocation defaults unless repetition or
overlap is explicitly safe. The complete shape is in `integration-tool.md`.

Plugin `Err(message)` is a normal rejected result and reaches the model
unchanged. A failure outside the guest selects flow text by its stable host kind:

| Host kind | Flow field |
|---|---|
| `timed_out` | `integrationHostFailureGuidance.timedOut` |
| `unavailable` | `integrationHostFailureGuidance.unavailable` |
| `sandbox_violation` | `integrationHostFailureGuidance.sandboxViolation` |
| `internal` | `integrationHostFailureGuidance.internal` |

During validation, that selected text rejects the original function call.
During wait-mode execution, it is injected asynchronously. Diagnostics remain
in persistence and logs; they are not substituted for authored model-facing
guidance.

## Secrets and logging

`plugin_contexts` is for call-specific values that the model must not see.
Flow `configuration` is non-secret. Never place secrets in flow JSON, plugin
manifests, CLI arguments, receipts, model placeholders, guest logs, or
model-facing errors/results.

Guest logs enter structured host tracing. Keep them bounded and never log raw
private context, credentials, identity values, or full external responses.
The platform already records the typed call, integration, execution, operation,
runtime, and metering dimensions outside guest-controlled log text.

## Testing checklist

1. Unit-test typed record/tool/config/context decoding and business logic.
2. Test every declared operation and malformed arguments.
3. Test `execute` independently from `validate`.
4. Use `execution_id` as the downstream idempotency key for mutations.
5. Exercise HTTP failure, timeout, oversized input/output, fuel exhaustion,
   malformed JSON, and guest rejection paths.
6. For every operation, run:

   ```text
   dino integration verify --component <artifact>
   dino --confirm-mutation integration.test integration test --policy <integrations-runtime.toml> --component <artifact> --operation <operation> --args <args.json> --record <record.json> --context <context.json> --config <config.json>
   ```

7. Confirm the flow `pluginRef`, manifest operations, receipt, and packaged
   Component agree, then run `dino agent validate`.
8. Confirm no generated Component, private data, credential, or workspace
   `.env` is being committed.

The local test command uses the selected versioned policy and reports generated
execution/call IDs, the runtime descriptor, limits, and per-phase guest and
builtin fuel. It may perform real HTTP side effects; use a mock endpoint unless
a real call is explicitly intended.
