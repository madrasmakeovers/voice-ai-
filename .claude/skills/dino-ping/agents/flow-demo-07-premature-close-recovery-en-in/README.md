# F07 — Premature Close Recovery

PNG previews are not bundled.

Demonstrates `onPrematureTransportClose`. If the caller disconnects before a
terminal outcome, Dino runs a dedicated post and records a typed
`mark_premature_close` signal instead of pretending the call reached a normal
disposition.

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
