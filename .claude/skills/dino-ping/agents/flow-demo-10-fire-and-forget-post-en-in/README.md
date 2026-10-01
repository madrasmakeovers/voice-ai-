# F10 — Fire-and-Forget Post

PNG previews are not bundled.

Demonstrates the complete multi-fact support pattern. The active flow writes
facts to `memory`, waits for a dashboard integration, closes the caller turn,
then the post reads memory, relays a fire-and-forget CRM note, and records a
local structured disposition.

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
dino integration build --agent-dir <absolute-agent-dir> --name demo_crm_embedded
dino integration verify --component <artifact-from-build-result>
dino agent validate --agent-dir <absolute-agent-dir>
```

Only when requested, generate a local preview after approval:

```text
dino agent render --agent-dir <absolute-agent-dir> --output <absolute-agent-dir>/preview.png --overwrite
```
