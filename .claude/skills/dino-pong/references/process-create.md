---
docVersion: "2.1.1"
docUpdated: "2026-09-11"
---

# Process creation

Complete [Pong](../SKILL.md) preflight. Each mutation below needs its own
approval; examples omit the confirmation flag. Use `dino-staging` for staging.

## Owner and agent

Ownership defaults to the API-key account. A Pong Client never passes a target
flag. An Account Manager may add `--for-client <email>` for a directly managed
Pong Client; the CLI resolves that relationship before creation. Only an
Ops-tier Admin uses `--for-user <email>` for an explicit Pong Client or Account
Manager target. Never combine the flags or invent an owner ID.

An AM-owned agent can serve the AM or a managed Client. A Client-owned agent
can serve only that same Client. Inspect the agent:

```text
dino agent get --agent-id <agent-uuid>
```

Pass the genesis ID to follow the latest active version on each new call.
Pass an exact version ID only when the user requires a pinned process.

## Resource selection

```text
dino catalog vox-servers
dino catalog transport-dids --direction outbound
dino catalog partner-credentials
```

Use `--direction inbound` for inbound creation. The runtime and partner
catalogs accept `--pattern <regex>`. For a managed target, add the same
`--for-client` or `--for-user` argument to every catalog and probe.
Select returned IDs matching the target's region and call direction.

Client processes require Client-owned DID and partner resources. AM processes
may use personally owned or Ops-granted resources. The process owner needs a
grant for the selected platform runtime; Admin authority does not bypass this.

Probe all four selected resources and require `status: ok` in each result:

```text
dino transport credentials test --id <transport-credential-uuid>
dino transport dids test --credential-id <transport-credential-uuid> --did-id <did-uuid>
dino partner test --id <partner-uuid>
dino runtime test --id <runtime-uuid>
```

These are read-only checks returning `status` and `checkedAt`. They do not
authorize process creation. Never create a disposable process as a probe.

## Explicit call policy

Use the user's established call policy, including Ping's transport-VAD policy
for experiments. Ask for missing values before creation; do not derive them
from platform/provider defaults. Include them all in mutation approval.

| Flag | Required value |
| --- | --- |
| `--vad-mode` | `partner_vad`, `vox_vad_lite`, `vox_vad_enterprise`, or `transport_client_vad` |
| `--vad-profile-id` | Required for `vox_vad_lite` and `vox_vad_enterprise`; forbidden for the other modes |
| `--hard-close-secs` | 90–900 seconds |
| `--lens-ttl-days` | 30–180 days |
| `--process-limit` | Batch/Drip only: 1–255, at most selected DID's `didLimit - onDemandLimit` |

Select the profile from the process owner's [VAD profiles](vad-profiles.md).

The selected agent flow owns idle audio and timing through `lifecycleAudio.idle`.
Without that optional configuration, idle prompts and timers are disabled.
Change this policy through agent evolution before process creation.

The process limit is an independent active-call ceiling, not a capacity
reservation or a value to sum across processes.

```text
dino process create-batch --agent-id <agent-uuid> --name <name> --region <region> --vox-server-id <runtime-uuid> --transport-did-id <did-uuid> --partner-credentials-id <partner-uuid> --vad-mode vox_vad_enterprise --vad-profile-id <profile-uuid> --hard-close-secs <seconds> --lens-ttl-days <days> --process-limit <limit>
```

Use `create-drip` with the same required arguments for Drip. Use
`create-inbound` without `--process-limit` for inbound. Add the resolved target
flag when required. The service independently verifies authority, resource
ownership/grants, and agent compatibility.

## Archive notification

For Batch or Drip, optionally add `--trigger <https-url>` at process creation.
Inbound does not accept this flag. Include the destination in mutation approval.

Command sends an HTTP POST after Lens successfully ingests each call archive:

```json
{
  "callId": "<call-uuid>",
  "processId": "<process-uuid>"
}
```

Each archived attempt has its own call ID and notification; this is not a batch-completion event.
The payload contains only these IDs, without audio, transcripts, or a Lens access link.
A terminal failure without an archive sends no notification.
Replaying an archive does not create another delivery attempt for the same call ID.
Legacy queued notifications remain stored but cannot be sent until archive settlement confirms readiness.

Delivery has a 10-second timeout and at most one attempt, without automatic retries or a signature.
A dispatcher crash can lose a notification; this is not a guaranteed-delivery channel.
A received HTTP response is saved as `triggerStatus` on the call, including non-success status codes.
No response leaves that field absent. See [call reads](calls.md) to inspect it.

The process trigger is separate from [Drip contact callbacks](drip.md).
The Drip callback secret does not sign these notifications.

## Verify the result

```text
dino process get --process-id <returned-process-uuid>
```

- Batch starts `provisioned`; continue with [Batch](batch.md).
- Drip starts empty and running without placing a call. Its creation response
  returns a callback secret once. Transfer it securely to the exact owner,
  outside chat and the skill workspace; it verifies webhooks, not API access.
  Continue with [Drip](drip.md).
- Inbound binds its DID until closed. Confirm that lasting effect before
  creation. Close with `dino process close-inbound --process-id <uuid>` under
  owner/authorized-manager scope and separate approval.
