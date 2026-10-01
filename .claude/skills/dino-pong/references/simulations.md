---
docVersion: "4.1.0"
docUpdated: "2026-09-21"
---

# Agent simulations

Connect two Dino agents on one Runtime and retrieve their separate call reports.

Follow [Dino Ping](../../dino-ping/SKILL.md) for environment, workspace, capability, and mutation approval requirements.
Use the selected environment's executable. These examples show `dino`.

## Supported interface

This release supports internal agent pairs only. External agents and external WebSocket connections are not available.
Require `simulation.run`, `simulation.get`, and `simulation.list` in the selected CLI's capabilities.
Use `dino-staging` for staging. An older `vox` executable can expose incompatible arguments.

`simulation.run` uses `POST /api/simulations`; `get` and `list` use the corresponding read endpoints.
The CLI constructs `simulationConfig`, `initiator`, `responder`, `voxServerId`, `callOverrides`, and optional `callbackUrl`.
These names describe the API contract; follow Ping's native CLI execution policy.
Creation rejects `mode`, `accelerated`, and transport-VAD settings. Historical status fields do not enable external creation.

## Prepare the pair

Use a Pong Account Manager or Client account with access to the selected runtime and partner credentials.
Both agents must be available for that account to deploy.
A simulation consumes two slots from the account's existing Widget concurrency limit.
Provider usage and normal call processing remain billable.

Both participants require Gemini credentials for AI Studio or Vertex AI.
Each Gemini partner credential must set automatic-VAD
`silenceDurationMs` to a value from 0 through 799. Simulation rejects unknown defaults and values
of 800 or more with `incompatible_vad_configuration`. It does not change the credential.
Simulation creation has no VAD option. Transport VAD profiles apply only to ordinary calls.
After all audio for a received turn arrives, the receiver sends its own provider 800 ms of silence.

Create a required simulation configuration file:

```json
{"firstSpeaker":"a"}
```

`a` selects the initiator agent; `b` selects the responder agent.
The configuration has no default. Missing, duplicate, unknown, and invalid fields are rejected.
Both agent and partner credential pairs are required. Cadence and initiation flags are not configuration fields.

Both LLMs receive their own persona and first-stage instructions during connection.
Simulation disables automatic initiation for both calls, regardless of their published initiation settings.
After both calls become ready, only the selected participant plays its greeting.
The other LLM hears the greeting, receives its silence tail, and responds.
No additional startup instruction triggers another response. Published agents remain unchanged.

The flow ends each conversation. When either call ends, the bridge closes its peer.
The existing `hardCloseSecs` call setting remains the fallback. Its supported range is 90 through 900 seconds.
There is no separate simulation duration setting.

## Run and inspect

After approval for `simulation.run`, invoke:

```sh
dino simulation run \
  --simulation-config /absolute/path/simulation.json \
  --initiator-agent-id <agent-uuid> \
  --initiator-partner-id <partner-credential-uuid> \
  --responder-agent-id <agent-uuid> \
  --responder-partner-id <partner-credential-uuid> \
  --runtime-id <runtime-uuid> \
  --hard-close-secs 90 \
  --callback-url https://example.com/simulation-status
```

Supply placeholders and integration contexts independently with absolute JSON file paths:

- `--initiator-placeholders` and `--responder-placeholders`
- `--initiator-plugin-contexts` and `--responder-plugin-contexts`

Execution always forwards audio immediately. Choose original timing or human cadence in Lens.
Playback selection does not change runtime delivery or timers.
The CLI records both sides of the transcript by default. Use `--transcription-mode in`
to record incoming speech only, or `--transcription-mode off` to disable transcription.
Provider response time and existing Runtime deadlines still use wall-clock time.
Accelerated ingestion support depends on the selected providers.

Save the returned `id`. Read the result without mutation confirmation:

```sh
dino simulation get --id <simulation-uuid>
```

If the simulation fails, read `failure.code`, `failure.participant`, and `error` in the status response.
For example, `provider_connection_timeout` with participant `b` means B could not connect before its deadline.
Other codes distinguish invalid configuration, full audio queues, failed audio delivery, cancellation, and unavailable runtimes.
The original failure remains available after the other participant stops. Callbacks use the same fields.
Older records can contain only the readable `error` field.
Request failures use the CLI error envelope. Inspect `error.apiCode` before interpreting the readable message.
Do not start a replacement run automatically; it creates another billable simulation.

List your latest simulations and their available Lens links:

```sh
dino simulation list
dino simulation list --limit 25 --offset 0
dino simulation list --limit 25 --offset 25
```

The default page contains up to 100 simulations, newest first. `--limit` accepts 1 through 100;
`--offset` skips that many records. The response contains `items`, `total`, `limit`, and `offset`.
Each item contains the simulation ID, status, creation time, both call IDs,
`initiatorLensUrl`, and `responderLensUrl`. Links are null until the archive is ready or after expiry.
Use `simulation get` for full reports. List reads do not extend link expiry or require mutation confirmation.
New simulations can shift offsets between requests; restart at offset zero to refresh the newest results.

## Reports and callbacks

The normal success path waits for both archives:

```text
starting -> running -> finalizing -> completed
              |                         |
         Runtime calls             Two Lens URLs
```

The response contains `initiator` and `responder`, each with `callId`, `archiveReady`, `lensUrl`, and `report`.
The report includes existing post-tools and failure details.
Shared Lens links omit internal integration diagnostics. Open the authenticated call page to inspect integration execution details.
Each Lens URL appears only after that call's archive reaches Lens.
Completion means both archives are ready; inspect the reports for conversation outcomes.
`archive_upload_failed` means recording delivery failed, even if the conversation ran successfully.
An available Lens link does not clear an earlier simulation failure.

The optional callback receives the same status payload through HTTP POST.
Callbacks can repeat. Use the simulation ID, status, and call archive flags to identify updates.
Failed deliveries retry after 30 seconds. Poll `simulation get` if a callback is delayed.
Rapid status transitions can produce only the latest status.
Lens links use the existing process expiry policy; status reads do not extend their expiry.

Simulation records stay out of normal Command process lists and account process summaries.
Command marks active simulations as failed after a restart. It does not replay provider sessions.
Already uploaded archives remain available through their individual Lens links.
