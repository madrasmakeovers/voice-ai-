# Drip

Create through [Process creation](process-create.md). Use `dino-staging` for
staging. Only the exact owner may control lifecycle, insert contacts, or read
and acknowledge failed callbacks. If a manager created the process for a
Client, have that Client use their own authenticated workspace and verify
`account get` plus `process get --process-id <uuid>` before continuing.

## Contact insertion

Obtain the inherited exact-invocation approval for designated destinations and
the potential billing effect. A running Drip may call as soon as capacity is
available; paused Drips keep inserted contacts pending.

```text
dino process place-call --process-id <uuid> --unique-id <correlation-id> --phone <approved-e164> --callback-url <https-url> --placeholders <absolute-object.json> --plugin-contexts <absolute-context.json>
```

Omit optional placeholder/context files when unnecessary. For 1–500 contacts,
prepare a JSON array and use `add-drip-contacts`:

```json
[
  {
    "unique_id": "crm-contact-123",
    "phone_number": "+919876543210",
    "customer_callback_url": "https://customer.example/calls",
    "placeholders": {"customer_name": "Asha"},
    "plugin_contexts": {
      "01900000-0000-7000-8000-000000000003": {"expectedValue": "1234"}
    }
  }
]
```

Replace the sample number and integration ID with approved, configured values.

```text
dino process add-drip-contacts --process-id <uuid> --input <absolute-records.json>
```

Insertion is atomic. Duplicate `unique_id` values within the file or already
stored in the same process reject the entire request, even if other fields
match. The identifier may be reused in another process. Never blindly replay
an insertion after an uncertain result.

## Private integration context

Placeholder keys and values are strings visible to the model. Private
`plugin_contexts` maps stable configured integration IDs to JSON objects; each
integration receives only its addressed object as `context`. Keep sensitive
input files outside the repository and chat.

The host supplies contact placeholders and the process correlation `unique_id`
separately in trusted `record`; do not use `unique_id` as a placeholder name.
`tool` contains the flow-selected `operation` and flattened, untrusted model
arguments. `configuration` contains the flow's shared non-secret settings.
Placeholders are not copied into private context, and there is no reserved
guest context namespace. See Ping's [ABI contract](../../dino-ping/references/flow-authoring/wasm-plugin.md)
when implementing the integration.

## Lifecycle

Each action requires a separate approval:

```text
dino process pause-drip --process-id <uuid>
dino process resume-drip --process-id <uuid>
dino process close-drip --process-id <uuid>
```

Pause holds pending contacts; resume can dispatch billable calls. Close is
permanent: a completed Drip cannot restart.

## Callback reconciliation

```text
dino process failed-callbacks --process-id <uuid>
```

This read does not consume failures. Reconcile delivery durably in the
customer's system, then put only the reconciled failure UUIDs into an absolute
JSON file containing an array of 1–100 strings. Obtain approval before:

```text
dino process ack-failed-callbacks --process-id <uuid> --input <absolute-ids.json>
dino process failed-callbacks --process-id <uuid>
```

Never acknowledge merely to clear the list. For partial reconciliation,
acknowledge only the durable subset.
