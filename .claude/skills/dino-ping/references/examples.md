---
docVersion: "1.0.2"
docUpdated: "2026-09-12"
---

# Agent examples

Examples use `dino` for production; substitute `dino-staging` for staging.
Follow the release and approval gates in [SKILL.md](../SKILL.md).

These examples define the [initial contract baseline](contracts.md), not an upgrade from a supported older format.

Select one folder under `agents/`. Each contains
`README.md`, `agent.toml`, `flow.json`, and four lifecycle Opus
assets. Custom integrations include Rust source, `vox-plugin.toml`, and
`vox-test.json` cases. Generated `plugins/` Components and receipts are excluded.
The compatibility suite recursively discovers every agent, validates all assets,
renders its flow, builds every integration, and exercises every referenced
operation under the selected runtime policy.

## Capability ladder

| Example | Pattern to study |
| --- | --- |
| F01 Basic End | One stage, office-hours instructions, terminal success/failure guidance |
| F02 Linear Routing | Three deterministic stages with no external tools |
| F03 Triage Dispatch | One-of-N selector dispatch plus strict disposition capture |
| F04 Nested Dispatch | A dispatch branch containing a second dispatch and escalation post |
| F05 End + Post Logging | `end_then_post` separates caller close from off-mic capture |
| F06 Multi-Outcome Posts | Distinct resolved/escalated posts share one strict capture contract |
| F07 Premature Close Recovery | Dedicated `onPrematureTransportClose` post and signal schema |
| F08 Stage-Gated Tools | PIN gate plus agent-owned multi-operation CRM component |
| F09 Wait Integration | Agent-owned validation acknowledgement, later result injection, operation deadline, stale-result drop |
| F10 Fire-and-Forget Post | Memory write/read, wait-for-result status, fire-and-forget relay, local capture |
| F11 Ordered Integration Chain | Dispatch plus an ordered chain across two agent-owned integrations |
| F12 Integration Context | Plugin reads trusted call context that the model must not supply |
| F13 Random Roll | One wait-for-result random-number request and result |
| F14 Multi Random Roll | Repeated wait-for-result calls bounded by flow-owned repeat policy |
| F15 Barge-in Disabled | Long assistant turns with `bargeIn: false`, playback acknowledgement, and repeat listening |
| F16 Multimodal Media | Real-time visual media testing for image uploads, photo capture, and streaming video frames |

## Use an example safely

1. Run `dino capabilities`; require protocol 1 and the intended operations.
2. Copy the selected folder into the explicit workspace's `agents/`
   directory using the host filesystem. Do not edit or build inside the
   installed skill package.
3. Give the copied agent its real `name` and `description`.
4. Before the first publish, generate a fresh UUIDv7 with
   `dino integration new-id` for every inline integration definition and
   replace its sample `id`, registry key, and every dispatch reference together.
   Keep each new ID stable across later evolves.
5. If the example has an `integrations/` directory, build each manifest by
   its `name`:

   ```text
   dino integration build --agent-dir <absolute-agent-dir> --name <integration-name>
   ```

   Parse the JSON result. Require `ok: true`, then pass the returned
   `data.artifact` to the independent language-neutral verifier:

   ```text
   dino integration verify --component <data.artifact>
   ```

6. Run the runtime-authoritative gate:

   ```text
   dino agent validate --agent-dir <absolute-agent-dir>
   ```

   Require `ok: true` and `data.valid: true` for config, flow, audio,
   Component ABI, build receipt, source hash, and ownership checks.
7. Publish only after validation:

   ```text
   dino agent publish --agent-dir <absolute-agent-dir>
   ```

Keep generated output inside the copied agent; never commit `plugins/`.

## Optional flow preview

PNG previews are not bundled. If asked about diagrams, explain that the CLI can render the full flow locally.
Generate a preview only when requested, after the skill's per-invocation approval:

```text
dino agent render --agent-dir <absolute-agent-dir> --output <absolute-agent-dir>/preview.png --overwrite
```

This offline operation writes a PNG and replaces an existing output file.

## Integration build map

These examples require an agent-owned build before validation:

| Example | `--name` |
| --- | --- |
| F08 | `demo_crm_embedded` |
| F09 | `demo_wasm_random_number` |
| F10 | `demo_crm_embedded` |
| F11 | `demo_crm_embedded`, `demo_wasm_random_number` |
| F12 | `demo_crm_embedded` |
| F13 | `demo_wasm_random_number` |
| F14 | `demo_wasm_random_number` |

F01 through F07, F15, and F16 have no external integration component.
