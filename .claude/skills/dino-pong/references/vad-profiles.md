---
docVersion: "2.1.2"
docUpdated: "2026-09-21"
---

# VAD profiles

Use owner-scoped VAD profiles to configure Dino speech detection.

Complete [Pong](../SKILL.md) preflight and inherited execution policy.
Use `dino-staging` for staging.
These operations require Ping tier or higher.

## Select the detector

Both Dino modes use the same Silero inference model and speech-boundary state machine.
The selected profile supplies the same five settings to either mode.

| Mode | Audio supplied to Silero |
| --- | --- |
| `vox_vad_lite` | Incoming PCM without RMS level normalization |
| `vox_vad_enterprise` | A copied PCM buffer with RMS level normalization before inference |

Enterprise adjusts signal level toward a fixed telephony target, with smoothed gain and peak limiting.
This preprocessing is not a different Silero model or a noise-removal model.
The profile does not configure its gain target.
Neither Partner VAD nor widget client VAD uses these server-side profile settings.
[Agent simulations](simulations.md) require Partner VAD and do not accept a transport-VAD profile.

## Owner scope

A Client uses their own profiles without a target flag.
An Account Manager uses their own profiles or adds `--for-client <email>` for a directly managed Client.
An Ops-tier Admin adds `--for-user <email>` for an explicit Client or Account Manager.
Use the same owner scope for profile selection and process creation.
Never combine the target flags.

## Inspect profiles

```text
dino account vad-profile list
dino account vad-profile get --profile-id <profile-uuid>
```

Results include the profile ID, name, settings, source commit, blob revision, and initial-profile status.
Select an ID from the target owner's returned profiles.
For experiments, follow Ping's transport-VAD policy: inspect the initial
profile (normally named `Default`) and use its standard Silero settings.
Use the initial-profile marker to identify it; do not guess an ID from its
name or copy another owner's profile ID. Do not retune the profile merely to
run a test.

## Create or change a profile

Obtain approval for the exact command and all settings before each mutation.
Examples omit the inherited `--confirm-mutation` flag.
Use `vadProfile.create`, `vadProfile.update`, or `vadProfile.delete` as the corresponding confirmation value.

| Flag | Valid value |
| --- | --- |
| `--name` | Profile name; required for creation |
| `--start-threshold` | Finite number from 0 through 1; greater than the end threshold |
| `--end-threshold` | Finite number from 0 through 1; less than the start threshold |
| `--start-ms` | Integer from 0 through 2000 milliseconds |
| `--end-ms` | Integer from 0 through 5000 milliseconds |
| `--smoothing-alpha` | Finite number greater than 0 and at most 1 |

```text
dino account vad-profile create --name <name> --start-threshold <number> --end-threshold <number> --start-ms <milliseconds> --end-ms <milliseconds> --smoothing-alpha <number>
dino account vad-profile update --profile-id <profile-uuid> --name <name>
dino account vad-profile delete --profile-id <profile-uuid>
```

Each setting has a validated Rust type. JSON decoding and CLI parsing reject values outside its range.
The complete profile also requires the start threshold to exceed the end threshold.
These checks reject invalid values instead of silently clamping them.

The thresholds apply to Silero's smoothed speech probability.
`start-ms` controls the speech evidence required before speech starts.
`end-ms` controls the low-probability interval before speech ends.
Higher `smoothing-alpha` gives the newest probability more weight; lower values smooth changes more strongly.

Creation requires all settings.
An update requires at least one name or settings flag and retains omitted values.
The CLI reads the current revision before an update or deletion.
A stale revision causes a conflict; inspect the current profile before a newly approved attempt.
The initial profile cannot be deleted.

## Select a process profile

Pass `--vad-profile-id <profile-uuid>` for `vox_vad_lite` and `vox_vad_enterprise`.
Omit that flag for `partner_vad` and `transport_client_vad`; those modes reject it.
See [process creation](process-create.md) for the remaining required arguments.


## Experience and profile revisions

Choose the VAD mode and profile when you [assign or update an Experience](experience.md).
Calls inherit that source configuration; the call dialog does not select a VAD profile.
Client clones use the source owner's profile. Browser widgets continue to use client VAD.

There is no automatic mode or profile selection in the CLI or API.
The initial profile remains an explicit choice, not a fallback.
A process or Experience stores a profile ID, not a pinned profile revision.
Command resolves the latest profile commit when it prepares each new call.
Updating that profile affects later calls; prepared and active calls keep their resolved settings.
No runtime restart is required.

Base provides a read-only profile viewer with revision history and comparisons.
Use the CLI to update settings, then compare the saved revisions in Base.
