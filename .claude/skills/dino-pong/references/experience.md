---
docVersion: "3.2.0"
docUpdated: "2026-09-12"
---

# Experience and widgets

Complete [Pong](../SKILL.md) preflight. Use `dino-staging` for staging. Assignment,
source update, cloning, and disabling require Account Manager authentication
and the inherited per-invocation approval. The source agent must belong to
that AM; a Client-owned agent cannot become the source.

## Assign or update a source

Inspect `account get`, `agent get --agent-id <uuid>`, and the sanitized
`catalog vox-servers`, `catalog transport-dids`, and
`catalog partner-credentials` results. Select a compatible AM-authorized bundle.
Obtain an explicit Experience name distinguishing this runtime combination;
never silently substitute the Base agent's name.

Prefer the agent's `genesisId` for `--agent-id` so the Experience follows later
publications. Use a specific version's `id` only when you intend to keep that
version. Assign and update preserve the ID you supply. When `agent get` resolves
a genesis ID, keep using `genesisId`; its returned `id` identifies the resolved
version.

```text
dino experience assign --agent-id <am-owned-agent-uuid> --name <experience-name> --region <region> --vox-server-id <uuid> --transport-did-id <uuid> --partner-credentials-id <uuid> --vad-mode vox_vad_enterprise --vad-profile-id <profile-uuid>
dino experience update --assignment-id <source-assignment-uuid> --agent-id <am-owned-agent-uuid> --name <experience-name> --region <region> --vox-server-id <uuid> --transport-did-id <uuid> --partner-credentials-id <uuid> --vad-mode vox_vad_enterprise --vad-profile-id <profile-uuid>
```

Choose the VAD mode explicitly when you assign or update the Experience.
For Dino VAD, select an AM-owned profile with `account vad-profile list` and provide its ID.
Partner VAD requires `--vad-mode partner_vad` without a profile ID.
There is no implicit mode or profile selection. Calls inherit the source assignment; callers cannot override VAD.
Browser widgets continue to use client VAD.

Choose one operation, not both. Save the returned assignment ID. Update replaces
the live source bundle. Optional `--integration-contexts <absolute-private.json>`
sets private context; during update omission preserves stored context, while
an empty object clears it. Linked Client sessions started later use the updated
source; disclose this effect before approval.

## Verify an assignment

```text
dino experience get --assignment-id <source-assignment-uuid>
dino experience get --assignment-id <client-assignment-uuid> --client-email <email>
```

Read the assignment after each update. Compare the display name, agent, infrastructure IDs, VAD configuration, and effective integration contexts.
Use the second command only for a directly managed Client assignment. The owning AM can inspect inherited configuration.
MCP exposes this read as `experience_get`, with `path.assignmentId` and optional `query.clientId`.
Reading an assignment does not start a call.

## Clone to a directly managed Client

```text
dino experience clone --assignment-id <source-assignment-uuid> --client-email <email>
```

Pass no infrastructure IDs. Save the returned Client assignment ID. The clone
references the live source's name and runtime bundle; the assignment authorizes
that runtime without a separate generic Client runtime grant.

## Read a widget

```text
dino experience get-widget --agent-id <uuid> --user-email <assigned-user-email>
```

This reads the default assigned widget in the permitted user scope. Widget
access does not grant process records or Base agent ownership.

## Disable

For one managed Client clone, pass its returned assignment ID and Client:

```text
dino experience disable --assignment-id <client-assignment-uuid> --client-email <email>
```

To disable the AM source and all active clones, omit `--client-email` and use
the source ID. Show this broader effect explicitly before approval.

Experience has no public CLI assignment enumeration or call-record listing.
If the required ID or call is unavailable through the public surface, report
the missing fact; never substitute private logs, HTTP, or guessed IDs.
