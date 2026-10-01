# Gemini TTS for Dino lifecycle audio

Use `dino agent generate-audio` to create the four static agent recordings:

- `src/greeting.opus`
- `src/error.opus`
- `src/time_limit.opus`
- `src/idle_warning.opus`

The native CLI calls Gemini `streamGenerateContent`, decodes each inline raw
PCM chunk, invokes `ffmpeg` with the `libopus` encoder to produce Ogg Opus,
validates the container and Opus identification header, stages every selected
role, and commits the selected set transactionally. It does not use a command
interpreter or JavaScript runtime. Before credentials are resolved or provider
usage can be incurred, it verifies that `ffmpeg` exposes `libopus`.

## Input

Write a JSON object. Unknown fields are rejected. A selected role must be
present; unselected roles may be omitted:

```json
{
  "greeting": "Hello, I am calling from ...",
  "error": "Sorry, I had trouble there. Let me try again.",
  "time_limit": "We are almost out of time, so I will quickly summarize.",
  "idle_warning": "Hello, are you still there?"
}
```

Keep each line short, literal, and suitable for exact recitation. These are
lifecycle snippets, not the full call script.

## Invocation

Check persistent credential state without revealing the key:

```text
dino credentials status --provider gemini
```

When `data.stored` is false, the user must create or rotate the key outside
chat and save it in an absolute, non-repository file with Unix mode `0400` or
`0600`. Never accept a provider key through chat, write a chat-supplied key to
disk, or put it in a command argument. After the standard human approval gate,
import that file once:

```text
dino credentials import --provider gemini --input <absolute-private-file>
```

Import refuses an existing credential. For an intentional rotation, obtain
fresh approval and add `--overwrite`. The destination is the user-scoped Dino
configuration store, not a deployment workspace, and command output contains
only the provider name and `stored` status. On Unix, the CLI creates the
credential directory with mode `0700` and the key file with mode `0600`.

`dino agent generate-audio` automatically uses the stored key. A key already
supplied by an operator-controlled process launcher in `GEMINI_API_KEY`,
`GOOGLE_API_KEY`, or `AI_STUDIO_API_KEY` is a one-run override and takes
precedence. Keep provider keys out of chat, arguments, repositories, logs,
skill files, and deployment workspace `.env` files.

Generate every role:

```text
dino agent generate-audio --agent-dir <absolute-agent-dir> --input <absolute-audio.json> --voice <voice> --style <direction>
```

Regenerate one or more individual roles by repeating `--role`:

```text
dino agent generate-audio --agent-dir <agent-dir> --input <audio.json> --role greeting --role idle_warning --overwrite
```

Omitting `--role` selects all four roles. Existing destinations cause a
conflict unless `--overwrite` is present. The command checks every collision
before provider calls. If provider generation or validation fails, none of the
selected destination files changes. If a filesystem commit fails, already
committed selected files are rolled back.

The result reports generated and unchanged roles, secret-free provider/model
metadata, source audio properties, and provider usage as opaque JSON. Do not
depend on the provider usage object's evolving field structure.

## Model, voice, and style

The CLI defaults are discoverable with
`dino agent generate-audio --help`. Pass explicit values when reproducible
authoring requires them.

Use the same voice as `agent.toml`. Useful starting points include:

- `Aoede` for an approachable voice.
- `Orus` or `Kore` for firmer operational prompts.
- `Puck` for upbeat demos.
- `Leda` for a youthful voice.

Treat `--style` as concise director notes, for example:

```text
natural, calm, professional Hindi support-agent tone; medium pace; clear articulation
```

Keep the transcript in the target language/script when possible. Avoid
putting director notes into role text and avoid long lines that can drift in
pace or voice.

## Verification

After generation, run:

```text
dino agent validate --agent-dir <absolute-agent-dir>
```

Do not publish until validation passes. Creation requires all four
roles. Evolve uses the CLI's authoritative drift and publication logic.

Typical failures:

| Error | Action |
| --- | --- |
| `authentication_failed` | Check `credentials status`; securely import or rotate the Gemini key, or fix an operator-managed environment override. |
| Missing `ffmpeg`/`libopus` precondition | Install an `ffmpeg` build with the `libopus` encoder, then rerun. No provider request was made. |
| `conflict` before generation | Add `--overwrite` only for intended destinations. |
| Missing selected role | Add the role to the input object or remove the corresponding `--role`. |
| Provider returned no/invalid audio | Retry only if the envelope marks the error retryable; otherwise shorten or clarify the line/style. |
| Validation fails | Ensure all four final `src/*.opus` assets and the rest of the agent contract are valid. |
