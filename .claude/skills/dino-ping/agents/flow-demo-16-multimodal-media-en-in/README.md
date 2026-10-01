---
docVersion: "1.0.1"
docUpdated: "2026-09-19"
---

# F16 — Multimodal Media

PNG previews are not bundled.

Demonstrates real-time multimodal capability with Gemini Live. The assistant invites the caller to share visual media—including snapping photos, uploading images, or streaming live video from their device camera—and conversationally describes or answers questions about the scene.

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
