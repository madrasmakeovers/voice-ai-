# Client Preview

Follow [SKILL.md](../SKILL.md) for environment, protocol, secrets, and approval.
Examples use production `dino`; use `dino-staging` for staging. Each mutation
requires its own approved capability confirmation, including retries.

## Preview a Client-owned agent after AM allocation

Use two authenticated workspaces or sessions: one for the directly managing
Account Manager and one for the Client. Do not exchange their API keys.

First, under the Account Manager's authentication, verify the actor and inspect
the Client's Preview setup:

```text
dino account get
dino account preview-allocations --for-client <client-email>
```

Require the Account Manager to manage that Client directly. The result exposes
the locked `previewPhoneNumber`, one Client `allocationId`, resource arrays, labels,
health evidence, and availability. An unavailable allocation stays visible so
the Account Manager can replace it. Require a DID with `available: true` and
`onDemandAvailable: true`, a compatible partner with `available: true`, and a
Dino server with `available: true`.

Then switch to the Client's own authenticated workspace and verify the actor
and active, Client-owned agent. Read the same catalog through the Client scope:

```text
dino account get
dino agent get --agent-id <client-owned-agent-uuid>
dino account preview-allocations
```

In this refreshed Client catalog, recheck the selected DID's `available` and
`onDemandAvailable`, the partner's `available`, and the Dino server's
`available` immediately before the call. Stop if any selected resource is
unready or no longer belongs to the active allocation.

Immediately before the call, show the Client, agent, locked destination, exact
Preview allocation ID, selected resource IDs, and potential billing effect. Obtain explicit approval
for that one real call. Place the Preview with the Client allocation ID:

```text
dino agent preview-call \
  --agent-id <client-owned-agent-uuid> \
  --allocation-id <client-preview-allocation-uuid> \
  --preview-did-id <selected-did-uuid> \
  --preview-partner-credential-id <selected-partner-uuid> \
  --preview-vox-server-id <selected-vox-runtime-uuid>
```

The command has no phone argument. Supply declared placeholder or plugin
context values from absolute JSON-object paths when needed:

```text
dino agent preview-call --agent-id <client-owned-agent-uuid> --allocation-id <uuid> --preview-did-id <uuid> --preview-partner-credential-id <uuid> --preview-vox-server-id <uuid> --placeholders <absolute-object.json> --plugin-contexts <absolute-object.json>
```

Save the returned `ddId` and fetch its status:

```text
dino agent preview-status --dd-id <dd-uuid>
```

Never use an AM key to impersonate the Client's preview operation.

## Replace one Client Preview allocation

Use the directly managing Account Manager workspace. Inspect the current
catalog and identify the exact Client allocation to replace:

```text
dino account get
dino account preview-allocations --for-client <client-email>
```

Before approval, show the Client, current allocation ID, all replacement
resource IDs, and expected revoke-and-replace effect. Run one approved
mutation:

```text
dino account replace-preview-allocation \
  --client-email <client-email> \
  --allocation-id <client-allocation-uuid> \
  --preview-did-id <source-did-uuid> \
  --preview-partner-credential-id <source-partner-uuid> \
  --preview-vox-server-id <source-vox-server-uuid>
```

The operation creates a new Client allocation and revokes the old allocation
in one transaction. Its result contains the new Client `allocationId`. Save
that ID. Refresh the catalog through a separate
read-only request:

```text
dino account preview-allocations --for-client <client-email>
```

Neither replacement nor listing places a call.

## Fetch preview-call results

Fetch only a preview owned by the authenticated caller:

```text
dino agent preview-status --dd-id <dd-uuid>
```

List paginated Client history and current Lens links:

```text
dino agent preview-calls list --limit <1-100>
```

An Account Manager can list one directly managed Client's history:

```text
dino agent preview-calls list --for-client <client-email> --limit <1-100>
```

When `nextCursor` is present, pass it to the next request:

```text
dino agent preview-calls list --cursor <next-cursor-uuid> --limit <1-100>
```

Use `--for-client` again on every Account Manager page. A Client cannot use
`--for-client`, and an Account Manager cannot list self history because only a
Client can place a Ping Preview call.

Pending and calling states may omit `callId`, `durationMs`, `lensUrl`, and
`postTools`. Wait before checking again; do not use a tight polling loop or
start a concurrent preview. A `409` means the actor already has an in-flight
interactive session across Ping preview, Experience telephony, or widgets.

Use terminal result fields only when present. A signed Lens URL grants access
only to the represented call. Its process-owned expiry is anchored to the
interaction's execution time, so repeated status, history, and export requests
retain the same expiry and do not renew the link. A terminal result may omit
`lensUrl` once that expiry has passed.

Command has a fresh-link route for the exact owner of an answered archived call,
with request-time validity of 1 through 30 days, but the current CLI has no
capability-backed operation for it. If a fresh link is needed, report that the
installed CLI cannot issue one. Never invoke the route through direct HTTP or
invent a CLI command.


## Change the locked destination

Only the directly managing Account Manager may change the Client's fixed
same-region destination, as a separate approved mutation:

```text
dino account set-client-preview --client-email <email> --phone <e164>
```

Allocation changes and destination changes never authorize a call.
