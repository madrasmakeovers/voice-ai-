# F14 — Multi Random Roll

PNG previews are not bundled.

Demonstrates repeated wait-for-result calls to one agent-owned integration.
The flow permits each new roll only after fresh caller consent and stops the
sequence through its flow-owned repeat policy.

Commands use `dino` for production; substitute `dino-staging` for staging.
Follow the installed Ping skill's release and approval gates.

Audio is not bundled. Before validation or publication, follow the
[audio setup](../../references/agents/gemini-tts.md) to write the four lifecycle
lines and configure a Gemini credential. Generate all four recordings first:

```text
dino agent generate-audio --agent-dir <absolute-agent-dir> --input <absolute-audio.json>
```

Build, independently verify, then validate:

```text
dino integration build --agent-dir <absolute-agent-dir> --name demo_wasm_random_number
dino integration verify --component <artifact-from-build-result>
dino agent validate --agent-dir <absolute-agent-dir>
```

Only when requested, generate a local preview after approval:

```text
dino agent render --agent-dir <absolute-agent-dir> --output <absolute-agent-dir>/preview.png --overwrite
```
