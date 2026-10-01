# F15 — Barge-in Disabled

Demonstrates one active stage with `bargeIn: false` and assistant descriptions
of 120 to 160 words. No integration or plugin build is required.

Start a session and say "Begin". The assistant describes a coastal walk, then
asks whether to give another description or finish. Say "Another" after
playback to repeat with a new scene, or "Finish" to end the call.

Try speaking during the latter part of a description, then speak again after
it finishes. The current runtime blocks provider input from generation
completion until the matching playback acknowledgement. Streaming speech
before generation completion can still be interrupted. Response length and
generation speed depend on the provider; a long response does not guarantee
a fixed protected interval. Raw microphone recording continues throughout.

The stage remains active between descriptions. This tests playback input
protection separately from the permanent input block used during closing.

Commands use `dino` for production; substitute `dino-staging` for staging.
Follow the installed Ping skill's release and approval gates.

Audio is not bundled. Before validation or publication, follow the
[audio setup](../../references/agents/gemini-tts.md) to write the four lifecycle
lines and configure a Gemini credential. Generate all four recordings first:

```text
dino agent generate-audio --agent-dir <absolute-agent-dir> --input <absolute-audio.json>
```

```text
dino agent validate --agent-dir <absolute-agent-dir>
```

PNG previews are not bundled.

Only when requested, generate a local preview after approval:

```text
dino agent render --agent-dir <absolute-agent-dir> --output <absolute-agent-dir>/preview.png --overwrite
```
