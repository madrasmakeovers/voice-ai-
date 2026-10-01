# F12 — Integration Context

PNG previews are not bundled.

Demonstrates the trusted context boundary. The model supplies only the unique
ID and message; the agent-owned integration reads recipient, account,
customer, city, campaign, segment, and locale context supplied by Dino. The
flow explicitly forbids asking the caller for those trusted fields.

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
