---
docVersion: "1.0.0"
docUpdated: "2026-09-06"
---

# Agent lifecycle

Follow [SKILL.md](../SKILL.md) for environment, protocol, secrets, and approval.
Examples use production `dino`; use `dino-staging` for staging. Each mutation
requires its own approved capability confirmation, including retries.

## Create and publish an agent

Create the authoring skeleton:

```text
dino agent scaffold --name <agent-name>
```

Edit the generated `agent.toml`, `flow.json`, lifecycle audio, and integration
sources. Validate before publishing:

```text
dino agent validate --agent-dir <absolute-agent-dir>
```

For a requested diagram, use [local rendering](examples.md#optional-flow-preview).
Publish only after validation succeeds:

```text
dino agent publish --agent-dir <absolute-agent-dir>
```

Publish commits local changes and pushes the committed snapshot to the agent's
published branch through Base's authenticated Git endpoint. Retrying uses the
same local commit. Unchanged files do not create another local commit.

Inspect the published version and its chain:

```text
dino agent get --agent-id <agent-uuid>
dino agent history --genesis-id <genesis-uuid>
```

The authenticated creator becomes the immutable chain owner. Publishing a downloaded agent retains its owner and genesis ID. Git records the current publisher’s name and email. Git rejects non-fast-forward pushes. Fetch the latest history, merge or rebase locally, resolve conflicts, validate, and publish again. Do not force-push protected branches.

## Download, change, and publish an agent

Download a visible version into the active workspace:

```text
dino agent download --agent-id <agent-uuid> --folder <local-name>
```

Each agent has its own Git repository with published, self, and shared AM branches, source audio, wire audio, and integration binaries. Download clones the real repository and preserves its commit hashes. A genesis ID selects latest; a version ID selects that exact revision. CLI sync metadata lives in ignored `.vox/agent-state.toml`.

When the target folder already contains this agent's checkout, download fetches
remote history without overwriting working files or moving the local branch.
Local Git can inspect differences and merge or rebase the fetched history. Use
`dino agent download` and `dino agent publish` for authenticated remote transfers.

Edit and validate the downloaded authoring directory:

```text
dino agent validate --agent-dir <absolute-agent-dir>
```

Publish a new version against the immutable genesis ID:

```text
dino agent publish --agent-dir <absolute-agent-dir>
```

Edit `name` in `agent.toml` only when the user intends to rename the chain.
An Account Manager may publish versions of chains
owned by their current directly managed Clients; a transfer changes which
Account Manager has that authority.

Verify the resulting history:

```text
dino agent history --genesis-id <genesis-uuid>
```

## Fetch agent metadata and version history

Narrow discovery with an anchored regular expression whenever the exact name
is known:

```text
dino agent list --pattern <anchored-regex>
```

If the user already supplied an agent ID, skip discovery and fetch that ID
directly.

Parse `data` from the protocol envelope. If discovery returns more than one
chain, stop and select by returned ID; do not silently choose the first name
match. Fetch the selected version, then use its returned genesis ID to inspect
the whole chain:

```text
dino agent get --agent-id <agent-uuid>
dino agent history --genesis-id <genesis-uuid>
```

Use an unfiltered list only when the user actually wants the complete visible
catalog:

```text
dino agent list
```

`list`, `get`, and `history` expose agent metadata and versions, not the
immutable publisher's user ID. Visibility, a successful Admin lookup, and a
similar name are not ownership proof. Report that missing fact instead of
inferring an owner or probing an internal route. Treat an out-of-scope `404`
as final.

## Deactivate an agent chain

Confirm the deployment, actor, genesis ID, and user intent:

```text
dino workspace current
dino account get
dino agent history --genesis-id <genesis-uuid>
```

Deactivate the entire chain:

```text
dino agent deactivate --genesis-id <genesis-uuid>
```

The owner, the owner's current directly managing Account Manager, or Ops root
may deactivate it. Deactivation affects the entire chain.

## Ownership

The authenticated publisher becomes the immutable owner of a new genesis
chain. Never send or invent an owner ID.

- Owners may read, evolve, and deactivate their chains.
- Clients may read only chains they own. Experience assignment does not grant
  Base catalogue access.
- Account Managers may read, evolve, and deactivate chains they own or that
  are owned by their current directly managed Clients. Client transfer grants
  this authority to the new Account Manager and removes it from the former
  Account Manager.
- Account Managers cannot access another Account Manager's chains or chains
  owned by that Account Manager's Clients.
- Admins may read every chain. Ops-tier Admin is the root lifecycle exception.
- Treat an out-of-scope `404` as final; never probe through another route.

Publishing does not create a general process. Ping Preview lazily creates only
an internal one-contact path from the Client's explicit Preview allocations.
Hand the agent ID and any
repeatable, inbound, batch, drip, or customer deployment requirements to an
Account Manager or Ops Admin through Dino Pong.

Read [api-surface.md](api-surface.md) for the complete CLI-to-route
mapping and authorization boundary.

Each agent repository has a `published` branch and optional `self` and `am`
draft branches. Owners write `self`; the current managing AM writes `am`.
Draft versions have their own IDs. Publishing a draft can fast-forward
`published` when Git permits it; diverged branches need a merge. Base's
Publish Version button performs the merge. Published and draft version IDs
remain separate even when their branches point to the same Git commit.
