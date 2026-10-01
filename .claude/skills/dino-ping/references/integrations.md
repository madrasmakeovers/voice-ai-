---
docVersion: "4.1.0"
docUpdated: "2026-09-09"
---

# Integration workflow

Follow [SKILL.md](../SKILL.md) for environment, protocol, secrets, and approval.
Examples use production `dino`; use `dino-staging` for staging. Each mutation
requires its own approved capability confirmation, including retries.

## Integrations

Generate stable UUIDv7 integration IDs with `dino integration new-id`; keep
an ID unchanged across agent versions. Create a Rust integration inside an
agent, then build it with:

```text
dino integration scaffold --agent-dir <agent-dir> --name customer-lookup --language rust --operation lookup_customer
dino integration build --agent-dir <agent-dir> --name customer-lookup
```

Sources live at `<agent-dir>/integrations/<name>/`; the verified component and
reproducible build receipt live at `<agent-dir>/plugins/`. The CLI invokes
Cargo directly, encodes the Component Model in-process, and never uses a
command interpreter or external `wasm-tools`.

The skill distributes integration source, never generated components. Build
inside the copied workspace agent, pass the returned `data.artifact` through
`dino integration verify`, then run `dino agent validate`. Do not commit the
generated `plugins/` directory. Rust scaffolds pin SDK candidate `0.2.0-rc.1`, which is not yet published.
Keep that registry pin in distributed source. Before publication, local CLI development requires the `VOX_INTEGRATION_SDK_PATH` override.
After publication, Cargo fetches and caches the exact SDK version from crates.io; GitHub access is not required.
No separate SDK installation is required. Enable its `guest` feature for plugin compilation.
Keep the pin; do not substitute an arbitrary newer SDK.
Both plugin phases return `Result<serde_json::Value, IntegrationError>`:
`validate` owns ordinary argument/domain rejection and may return acknowledgement
data, while `execute` owns the operation result. Flow-authored
`integrationHostFailureGuidance` is only for failures outside the plugin result.

Other languages are supported when their toolchain emits a Component Model
`.wasm` implementing `vox:integration/plugin@0.2.0`:

```text
dino integration scaffold --agent-dir <agent-dir> --name customer-lookup --language prebuilt --operation lookup_customer
dino integration package --agent-dir <agent-dir> --name customer-lookup --component <component.wasm>
dino integration verify --component <artifact-returned-by-package>
```

Do not place build commands in `vox-plugin.toml`. `vox` accepts only its
built-in safe adapters; `verify` and `package` are language-neutral. Read
[wasm-plugin.md](flow-authoring/wasm-plugin.md) for the manifest,
layout, receipt, and ABI contract.

`build` and `package` embed the plugin contract declaration in the Component.
They do not replace an existing unsupported declaration. Rebuild the source instead.
Upload and runtime loading require that declaration, including for plugins without host imports.

`verify` checks the declared version and Component/WIT boundary. Select the reviewed policy for
the target deployment before publication. The skill includes
[integrations-runtime.toml](integrations-runtime.toml) as its versioned authoring baseline.
The policy must declare the supported `version = 1` format.
Exercise each operation through that policy:

```text
dino --confirm-mutation integration.test integration test --policy <integrations-runtime.toml> --component <component.wasm> --operation <operation> --args <args.json> --record <record.json> --context <context.json> --config <config.json>
```

Omit `--config` when there are no additional static settings. This command can
perform real HTTP side effects and therefore follows the same per-invocation
human approval gate as every other mutation.

## Choose where code belongs

Use the SDK for the Dino contract and wrappers around existing builtins.
Keep integration workflows and business rules in customer WASM.

| Location | Purpose |
| --- | --- |
| SDK | WIT bindings, plugin exports, request/result types, contract checks, and builtin wrappers |
| Host builtin | Shared capabilities with enforceable input, output, time, and resource limits |
| Copyable examples | Efficient Rust techniques and vendor implementations customers can adapt |
| Customer plugin | Workflow decisions, vendor queries, and business rules |

Reuse alone does not justify a new SDK helper. Prefer examples for general JSON
techniques and vendor authentication. General algorithms stay in customer code. See [Serde snippets](integration-snippets.md) for typed decoding.

Bounded work is a candidate for a builtin. Measure its value and boundary costs
before adding one. Customer WASM continues to control the integration workflow.

## Measure fuel before adding a builtin

Guest fuel measures code inside WASM, including the SDK compiled into the plugin.
Builtin charges measure host capabilities separately. A large guest total does not
prove that the HTTP builtin is expensive.

Check for unnecessary JSON copies before proposing a new builtin. Copying a
configuration before reading it is like photocopying a sheet before reading it.
Use the original data when ownership permits.

For example, given `fields: serde_json::Map<String, serde_json::Value>`, this
expression copies the entire object before encoding it:

```rust
let encoded = serde_json::to_vec(&serde_json::Value::Object(fields.clone()))?;
```

Borrow the map to encode the same JSON without that copy:

```rust
let encoded = serde_json::to_vec(&fields)?;
```

Both expressions propagate encoding errors through `?` in the enclosing function.
The second expression preserves `fields` for later use. Keep required input,
permission, and business validation when removing redundant work.

When the caller no longer needs the JSON object, transfer ownership during typed
decoding instead of cloning it. For a deserializable application type `Config`:

```rust
let config: Config = serde_json::from_value(serde_json::Value::Object(fields))?;
```

This expression consumes `fields`. Existing SDK payloads expose `into_value()`
for use with `serde_json::from_value`. No new SDK method is necessary.
Decode configuration once per phase, then pass the typed value to helpers.
Each phase must retain its required validation.

A generic borrowed-map decoder is not necessarily equivalent to a JSON deserializer.
Check enum, wrapper, nested-value, and invalid-input behavior before replacing a decoder.
Direct JSON-to-struct parsing must preserve the original boundary checks.

Measure the compiled Component before and after the change. Use identical inputs,
runtime, and policy. Check that results and rejection behavior remain equivalent.
Compare validation and execution fuel separately because each phase has its own budget.

A large saving in one decoding helper can produce a smaller saving in a complete
operation. Savings depend on the workload and are not performance guarantees.
Report helper costs and complete-operation costs separately. A local-content test
does not establish savings for a live HTTP operation.

Consider a reusable builtin when measured costs remain high after ordinary code
improvements. Include boundary transfers and any remaining guest decoding in its
measurement. Keep integration orchestration and business rules inside WASM.
