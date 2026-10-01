---
docVersion: "1.0.0"
docUpdated: "2026-09-07"
---

# Account-owned infrastructure

Create and verify credentials and DIDs owned by the current account.

Complete [Pong](../SKILL.md) preflight. Use `dino-staging` for staging.
Pong Clients and Account Managers create/delete only their own transport and
partner resources: omit target flags on writes. An AM cannot create or delete
a Client credential. Ping Clients use Preview allocations instead.

## Inspect and manage

Read secret-free metadata:

```text
dino transport credentials list
dino transport dids list --credential-id <uuid>
dino partner list
```

Obtain each mutation's approval, then create from absolute private JSON files:

```text
dino transport credentials create --input <absolute-private.json>
dino transport credentials test --id <created-credential-uuid>
dino transport dids create --credential-id <uuid> --input <absolute-private.json>
dino transport dids test --credential-id <uuid> --did-id <created-did-uuid>
dino partner create --input <absolute-private.json>
dino partner test --id <created-partner-uuid>
```

Run each test immediately after successful creation, in the same workspace and account.
These read-only checks place no calls and require no additional approval or confirmation flag.
Require `ok: true` and `data.status: "ok"` before reporting the resource as ready.
If a check fails, report the result and stop before dependent setup or calls.
Creation alone leaves the resource unchecked. Passing these checks does not verify callback routing or a complete call.

Transport kinds are Exotel, Twilio, and Tata; partner kinds are Vertex and AI
Studio. Consult the selected command's help for typed input requirements; do
not invent provider fields. Never put raw credentials in chat or the public
skill workspace. Use only redacted result metadata.

For process resource selection and the four required read-only probes, read
[Process creation](process-create.md). Apply the same target to every catalog
and probe; target flags do not transfer resource ownership.

Retire only an owned resource, with separate approval for each exact target:

```text
dino transport credentials delete --id <uuid>
dino transport dids delete --credential-id <uuid> --did-id <uuid>
dino partner delete --id <uuid>
```

## Runtime delegation

Ops creates platform runtimes and grants them to AMs. An AM can delegate a
granted runtime to a directly managed Pong Client:

```text
dino runtime grant --vox-server-id <uuid> --client-email <email>
dino runtime revoke --vox-server-id <uuid> --client-email <email>
```

Both mutations require separate approval. Delegation neither transfers runtime
ownership nor grants DID/partner credentials. Client processes still need
Client-owned DID and partner resources. AM-owned processes may use AM-owned or
Ops-granted resources. Global runtime registration and Ops-to-AM grants belong
to Dino Ops.
