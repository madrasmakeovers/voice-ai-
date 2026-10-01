# Workspace Migration

Use this procedure before replacing an older `vox` or `dino` installation
with the strict environment-manifest release. The CLI has no legacy loader or
migration command. The AI agent owns the complete local migration.

## Inspect

Resolve the exact workspace from `dino workspace list` and `dino workspace
current`. Read its `.env` through a secret-safe filesystem operation that does
not print values. Require a regular, non-symlink file with owner-only `0400` or
`0600` permissions and one non-empty `VOX_API_KEY`.

Classify the deployment from the existing contract:

- `VOX_ENVIRONMENT=staging` or `production` is already authoritative.
- `VOX_API_URL=https://api.dinodial.tech` is staging.
- `VOX_API_URL=https://api.dinodial.ai` is production.
- A complete removed service-URL set is staging when every origin is an
  official `dinodial.tech` origin, and production when every origin is an
  official `dinodial.ai` origin.
- A workspace with only `VOX_API_KEY` is the former public production default.
- Mixed, partial, development, localhost, or third-party endpoint values are
  ambiguous. Ask the user to select staging or production. Do not preserve or
  translate a custom URL.

Reject duplicate keys, malformed lines, empty keys, unknown secret fields,
and symbolic links. Never include the API key or endpoint values in chat,
logs, command arguments, or migration output.

## Approve

Show the canonical workspace path, selected environment, names of fields that
will be removed, and this exact result:

```text
VOX_API_KEY=<preserved>
VOX_ENVIRONMENT=<staging|production>
```

Obtain explicit approval for this one local mutation. A different path,
environment, source state, or retry needs new approval.

## Replace

Use the host's secret-safe atomic file operation. Preserve the exact API-key
bytes in memory, write only the two approved fields to a new owner-only file,
flush it, and atomically replace `.env`. Do not create a plaintext backup or
leave a temporary file. Preserve `0400` when the host can atomically replace a
read-only file; otherwise use `0600`.

Do not modify `agents/`, workspace registration, credentials, or any remote
state.

## Verify

With the candidate strict CLI, run:

```text
dino --workspace <absolute-workspace> workspace check
```

Require the selected environment, the corresponding manifest endpoint, and
`apiKeyConfigured: true`. Then inspect `.env` again without printing values
and require exactly one `VOX_API_KEY` and one `VOX_ENVIRONMENT`. Stop on any
failure; do not retry by restoring legacy fields or adding endpoint flags.
