---
docVersion: "2.0.1"
docUpdated: "2026-09-09"
---

# Contract versions

Use the candidate contract versions to author artifacts for matching services and CLI builds.

## Current candidate

| Piece | Baseline |
| --- | --- |
| Flow contract | `0.1.0` |
| Plugin contract | `0.2.0` |
| SDK package | `0.2.0-rc.1` |

SDK `0.2.0-rc.1` is not yet published. Local source checks use the SDK override until publication.
Create artifacts from the current bundled examples. The runtime does not convert legacy artifacts or execute older contracts.

The SDK package already has a release history. Its package number does not represent the plugin contract version.
Keep existing SDK, CLI, and skills package versions; do not relabel published releases to match the contract baseline.

## Version authority

| Piece | Artifact declaration | Authority |
| --- | --- | --- |
| Flow | `flow.json` → `contractVersion` | Compiled flow validator |
| Plugin | Versioned WIT ABI and `vox:integration/contract` inside packaged WASM | Compiled Integrations host |
| SDK | Rust dependency version | SDK package release |

The selected environment's manifest advertises `contracts.flow`, `contracts.plugin`, and `integrationSdkVersion`.
The CLI's JSON `version` result reports its compiled contracts and SDK release.
Compare these values before authoring for an environment. Do not assume that the newest release supports another environment.

The manifest does not change backend behavior. Deployment configuration cannot change the compiled supported contract.

The release uses one direction of authority:

```text
Canonical Rust contract definitions
                |
        +-------+--------+
        |                |
        v                v
  Backend validators   CLI binary
        |                |
        |           version output
        |                |
        |                v
        |       Candidate manifest
        |                |
        v                v
  Accept or reject    Skills select
  each artifact       upgrade guide
```

The manifest cannot override the backend validator.

## Flow validation

Every flow must declare its contract:

```json
{
  "contractVersion": "0.1.0"
}
```

This fragment is not a complete flow.
The validator checks the version before it checks the current flow structure.
An unsupported version and malformed JSON are different failures.
Missing versions are invalid. Older versions do not receive compatibility defaults.

Publishing an artifact does not exempt it from validation when a new call resolves it.
For future upgrades, apply the matching procedure before changing an artifact's version label.

## Migration history

Plugin contract `0.2.0` replaces `0.1.0` with typed HTTP failures, byte-valued headers, and response-body limits.
Rebuild integration source with SDK `0.2.0-rc.1`; do not change only the artifact's version label.
Use the [plugin build and verification procedure](flow-authoring/wasm-plugin.md) with the matching candidate CLI.
Verify the rebuilt Component and complete agent before publication. The flow contract remains unchanged.
Publish the matching SDK, services, CLI, and skills before activating their environment manifest.
Retain each upgrade procedure when adding subsequent contract changes.
An SDK-only fix does not require a plugin-contract change unless the interface or payload contract changes.
Change only the version of the affected piece. Update its examples, validators, manifest metadata, and skills in the same release.

## Changelog

### Plugin contract 0.2.0 candidate

- Require `contractVersion` in every flow.
- Reject unsupported versions before current-structure validation.
- Use plugin ABI `vox:integration/plugin@0.2.0` and SDK package `0.2.0-rc.1`.
- Ship complete agent examples with explicit versions.
- Provide no backward execution or automatic migration.

This guide describes the candidate release. Do not publish its manifest before the matching services, CLI, and skills are ready.
