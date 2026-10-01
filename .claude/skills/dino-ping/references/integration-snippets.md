---
docVersion: "1.2.0"
docUpdated: "2026-09-08"
---

# Customer-owned integration snippets

Use standard Rust and Serde for customer data. Copy these patterns into the
plugin; they run inside WASM and consume guest fuel. The SDK supplies the Dino
contract and builtin bindings, not generic decoding or vendor workflow APIs.

## Decode an owned payload

When execute owns the request, transfer the configuration map without cloning it:

```rust
let config: Config = serde_json::from_value(request.configuration.into_value())
    .map_err(IntegrationError::Encoding)?;
```

## Decode while retaining the request

Validation borrows the request. A normal JSON value preserves Serde behavior
for structs, enums, wrappers, and nested values, but cloning has a fuel cost:

```rust
let config: Config = serde_json::from_value(serde_json::Value::Object(
    request.configuration.as_map().clone(),
))
.map_err(IntegrationError::Encoding)?;

let arguments: Arguments = serde_json::from_value(serde_json::Value::Object(
    request.tool.fields().clone(),
))
.map_err(IntegrationError::Encoding)?;
```

`Config` and `Arguments` are customer-defined types deriving `serde::Deserialize`.
Import `dino_sdk::IntegrationError` for these examples. Dino boundary
validation still runs before customer decoding; business rules remain in the plugin.

## Serialize a borrowed map

```rust
let body = serde_json::to_vec(request.tool.fields())
    .map_err(IntegrationError::Encoding)?;
```

Serialize the existing map directly when sending its fields. Do not clone it
into a temporary `Value` merely to encode it. Choose the vendor body shape in
customer code; this snippet does not imply every endpoint accepts Dino arguments.

Keep OAuth, pagination, retry decisions, and vendor error handling in the plugin.
Use the existing HTTP builtin wrapper for network requests. Do not add an SDK
convenience API merely to shorten these patterns.

## Move owned response fields

When the plugin owns a JSON response, remove the required field instead of
cloning its entire subtree:

```rust
let items = response
    .get_mut("data")
    .and_then(serde_json::Value::as_object_mut)
    .and_then(|data| data.remove("items"))
    .filter(|value| !value.is_null())
    .ok_or_else(|| IntegrationError::new("Missing response items"))?;
```

Here `response` is a mutable, owned `serde_json::Value`. Check vendor errors
before extraction. This pattern consumes the field; other response fields remain.

Likewise, move an owned array into a loop instead of cloning every retained row:

```rust
let serde_json::Value::Array(rows) = items else {
    return Err(IntegrationError::new("Expected response array"));
};
let retained: Vec<_> = rows.into_iter().filter(|row| row["active"] == true).collect();
```

## Sort borrowed keys

A sort comparator can execute many times. Read existing values instead of
serializing each sort key to JSON:

```rust
rows.sort_by(|left, right| {
    (left["date"].as_str(), left["start_time"].as_str())
        .cmp(&(right["date"].as_str(), right["start_time"].as_str()))
});
```

Use this example only after validating both fields as canonical date and time
strings. Choose the vendor's required ordering explicitly. JSON-escaped strings
and raw strings do not have identical ordering for every possible character.

## Measure JSON decoding from UTF-8

For responses containing many strings, benchmark validating UTF-8 once before
Serde decoding. This can avoid separate UTF-8 checks for every JSON string:

```rust
let value: serde_json::Value = match std::str::from_utf8(&body) {
    Ok(raw) => serde_json::from_str(raw),
    Err(_) => serde_json::from_slice(&body),
}
.map_err(IntegrationError::Encoding)?;
```

The fallback preserves Serde's invalid-input rejection. Test Unicode, escapes,
malformed JSON, and invalid UTF-8. This is a workload-dependent optimization;
compare complete WASM fuel and component size before adopting it.

For fixed-format vendor dates, a checked numeric fast path can avoid repeated
format parsing. Retain calendar validation and the original parser for other
accepted formats. Check leap days, leap seconds, and malformed input before
using such a path. Do not weaken validation to reduce fuel.

## Keep vendor responses typed until output

For a stable vendor response, deserialize known fields into customer-owned
structs instead of creating a generic JSON map for each row. Retain dynamic
values where the vendor legitimately returns multiple scalar types.

```rust
#[derive(serde::Deserialize)]
struct VendorRow {
    id: serde_json::Value,
    status: String,
}

let rows: Vec<VendorRow> = serde_json::from_slice(&body)
    .map_err(IntegrationError::Encoding)?;
```

Adapt the envelope to the actual API. Check vendor errors before using results.
Choose required, optional, and ignored fields deliberately. Derived deserializers
can reject duplicate or malformed fields that a generic JSON map accepted.

Filter, sort, and truncate typed rows before converting them into the final JSON
result. Preserve the original total count when the result includes a limited list.
Fetch only fields the workflow actually uses. Verify output types, null handling,
ordering, and business validation against the previous implementation.

## Serialize a borrowed request directly

Use a borrowed struct for a known request envelope instead of constructing a
JSON object that copies its strings:

```rust
#[derive(serde::Serialize)]
struct Query<'a> {
    query: &'a str,
}

let body = serde_json::to_vec(&Query { query: &query_text })
    .map_err(IntegrationError::Encoding)?;
```

Measure complete operations after each change. Typed decoding can increase the
compiled component size because Rust generates code for each response type.
