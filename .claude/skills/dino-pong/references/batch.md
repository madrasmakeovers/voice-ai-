# Batch

Create an empty batch through [Process creation](process-create.md). Use
`dino-staging` for staging. Every mutation follows the inherited approval gate.
An authorized manager may operate a managed Client's batch without switching
to that Client's authentication.

## Import and dispatch

Prepare an absolute-path mapping file:

```json
{
  "uniqueIdColumn": "unique_id",
  "phoneColumn": "phone",
  "fieldColumns": {"customer_name": "name"}
}
```

Inspect the process, then choose one import while it is `provisioned`:

```text
dino process get --process-id <uuid>
dino process import-csv --process-id <uuid> --csv <absolute-contacts.csv> --mapping <absolute-mapping.json>
dino process import-sheet --process-id <uuid> --sheet-url <url> --mapping <absolute-mapping.json>
```

Import is atomic and moves the process to `ready` without calling. Inspect
returned counts/errors and refresh `process get`. Do not reinterpret a Google
Sheet locally when the typed import is available. Dispatch only after approval
for the destinations and billing effect:

```text
dino process set-phase --process-id <uuid> --phase running
```

## Lifecycle and export

Fetch current state before each action. Each row is a separate operation, not
a script to execute in sequence.

| Intent | Command after `dino process` | Effect |
| --- | --- | --- |
| Pause | `set-phase --process-id <uuid> --phase paused` | Pause a running batch |
| Resume | `set-phase --process-id <uuid> --phase running` | May dispatch billable calls |
| Complete | `set-phase --process-id <uuid> --phase completed` | Complete an eligible batch |
| Retry | `retry-batch --process-id <uuid>` | Eligible completed batch returns to `ready`; no call yet |
| Discard | `discard-batch --process-id <uuid>` | Only `provisioned`; history retained |
| Export | `export-contacts --process-id <uuid> --output <absolute-outcomes.csv>` | Contact outcomes, including unanswered contacts; no pricing/cost fields |

Use `--overwrite` only for intended replacement of the exact export file.
Retrying does not authorize dispatch; moving the batch to `running` requires
its own approval. On lifecycle conflict, refresh state and select a documented
transition; never blindly retry.
