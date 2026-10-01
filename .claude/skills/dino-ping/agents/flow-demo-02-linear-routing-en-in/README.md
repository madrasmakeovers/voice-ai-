# F02 — Linear Routing

PNG previews are not bundled.

Demonstrates deterministic stage-to-stage routing without external tools.
The flow collects two facts, runs a troubleshooting sequence, and closes from
the final stage. It shows that stages are decision checkpoints, not individual
conversation turns.

Commands use `dino` for production; substitute `dino-staging` for staging.
Follow the installed Ping skill's release and approval gates.

Audio is not bundled. Before validation or publication, follow the
[audio setup](../../references/agents/gemini-tts.md) to write the four lifecycle
lines and configure a Gemini credential. Generate all four recordings first:

```text
dino agent generate-audio --agent-dir <absolute-agent-dir> --input <absolute-audio.json>
```

No plugin build is required.

```text
dino agent validate --agent-dir <absolute-agent-dir>
```

Only when requested, generate a local preview after approval:

```text
dino agent render --agent-dir <absolute-agent-dir> --output <absolute-agent-dir>/preview.png --overwrite
```
