# Transport test handoff

Use this reference to discover transport files and route carrier tests to Dino
Ops.

## Boundary

- `dino transport` supports Exotel, Tata, and Twilio.
- The commands use private local files and do not need a public Dino workspace.
- `profile.json` contains carrier secrets.
- `call.json` contains the exact test destination.
- Ping can list fields and create empty templates.
- Dino Ops owns profile population, deployed-credential materialization,
  carrier probes, and test calls.
- Never put a credential, profile, or provider response body in chat or a
  repository.

## Discover the schema

Run the read-only provider command:

```text
dino transport providers
```

Use its `accountFields`, `didFields`, `callFields`, `probeChecks`, and
`testCallChecks` values as the current contract. Do not reuse one provider's
shape for another provider.

## Create empty files

Show the provider, absolute output directory, and two-file write. Obtain
explicit approval for `transport.scaffold`, then invoke it once:

```text
dino --confirm-mutation transport.scaffold transport scaffold \
  --provider <exotel|twilio|tata> \
  --output-dir <absolute-private-directory>
```

The command creates a mode-`0700` directory. It creates `profile.json` and
`call.json` at mode `0600`. It refuses replacement unless `--overwrite` is
explicitly approved.

## Hand off to Dino Ops

Activate Dino Ops when the request requires one of these actions:

- Put account or DID credentials in `profile.json`.
- Materialize a deployed credential and outbound DID for a test.
- Put the approved destination or Exotel callback URL in `call.json`.
- Run `dino transport probe` against a carrier.
- Run a real `dino transport test-call`.

Do not use direct HTTP, deployment files, database access, or redacted list
output to reconstruct a profile. Dino Ops supplies the secret-handling and
per-call approval workflow.
