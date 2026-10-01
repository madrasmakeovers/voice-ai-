# Workflow index and recovery

Read [SKILL.md](../SKILL.md) first. It owns release checks, environment
selection, secret handling, and per-invocation approval. Examples use `dino`
for production; substitute `dino-staging` for staging.

Load the reference for the task, not the whole index of references:

| Workflow | Reference |
| --- | --- |
| Install, preflight, register, or switch environment | [Setup](setup.md) |
| Account read, billing export, Client provisioning | [Accounts](accounts.md) |
| Create, download, validate, publish, evolve, inspect, deactivate | [Agent lifecycle](agent-lifecycle.md) |
| Client Preview, AM allocation replacement, history/status | [Preview](preview.md) |
| Generate lifecycle audio | [Audio](agents/gemini-tts.md) |
| Build Rust integration or package prebuilt Component | [Integrations](integrations.md) |

## Handle common failures

Use structured `error.apiCode` when present, then `error.code`,
`error.retryable`, and `error.details`; HTTP numbers below describe the
server condition, not a reason to scrape error messages.

- Authentication failure (`401`): repair the selected workspace credential
  without printing it.
- Permission failure (`403`): stop; do not switch identities unless the user
  explicitly selects another workspace.
- Absent/out-of-scope resource (`404`): stop; never probe another route.
- Preview conflict (`409`): report the existing interactive session; do not
  launch another Preview, Experience call, or widget session concurrently.
- Retryable publish failure: preserve the local commit, fetch current remote
  history, and obtain fresh approval before retrying the push.
- Validation failure: fix authoring files and rerun `agent validate`; never
  publish around failed validation.
- Missing capability or release mismatch: return to [setup](setup.md); no
  legacy script, guessed command, or direct HTTP fallback.
