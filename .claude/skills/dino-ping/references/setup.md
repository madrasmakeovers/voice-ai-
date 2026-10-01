# Release and workspace setup

Use this before deployment access each session, after installing skills, and
whenever the workspace or environment changes. It is the canonical installed
setup procedure; [SKILL.md](../SKILL.md) owns execution and approval policy.

## Select and check the skills release

1. Resolve the user's intended environment: production, staging, or both.
   Ask if unclear. For both, configure separate editor workspace roots; run
   each environment's setup independently.
2. Fetch `https://dino.dinodial.ai/manifest.json` through read-only HTTPS.
   Require `schemaVersion: 1` and the selected environment entry.
3. Require its exact `skillsVersion`, `skillsBuildPath`, `skillsSha256`,
   `cliVersion`, and `cliBuildPath`. Require paths
   `releases/dino-skills/v<skillsVersion>` and
   `releases/dino/v<cliVersion>`. Missing fields or an invalid checksum/version
   are a release configuration error: stop before deployment access.
4. Read this skill's `../release.json`. Require `environment`,
   `skillsVersion`, and `cliVersion` to match the selected manifest entry
   exactly. Reject `candidate: true` for deployed work. If using Pong, require
   its sibling release metadata to match too.
5. Missing or mismatched installed metadata requires replacing the skill pair
   through `https://dino.dinodial.ai/dino.skill`, with installation approval.
   The archive is
   `https://dino.dinodial.ai/<skillsBuildPath>/dino-skills.zip`; verify its
   SHA-256 against `skillsSha256` before extraction. Reload the editor's
   installed skills after replacement and restart this gate. Never continue
   with stale loaded instructions.

These downloads are public release reads, not authorization for direct Dino
API calls. A source checkout without generated release metadata is authoring
material, not a verified deployed installation.

## Select and check the CLI

| Environment | Native executable | Registered workspace name |
| --- | --- | --- |
| production | `dino` | `prod` |
| staging | `dino-staging` | `staging` |

Examples below use `dino`; substitute `dino-staging` for staging.
Invoke the native `dino` or `dino-staging` executable directly.

Run the selected executable's `version`. Require `data.environment` to
match the selected environment and `data.packageVersion` to equal
`cliVersion`. A newer version is incompatible; missing environment metadata
is also incompatible. Record `data.buildSha` and reject `unknown` for a
release installation.

If missing or mismatched, show the environment, current/required versions,
exact build path, destination paths, and install effect. Obtain approval before
installing. Otherwise proceed to `version check` below.

### Install the selected native binary

Download the host's archive and its matching `.sha256` file from
`https://dino.dinodial.ai/<cliBuildPath>/`:

| Host | Archive |
| --- | --- |
| Linux x86-64 | `dino-x86_64-unknown-linux-musl.tar.xz` |
| macOS Apple silicon | `dino-aarch64-apple-darwin.tar.xz` |
| Windows x86-64 | `dino-x86_64-pc-windows-msvc.zip` |

Stop on other platforms. Verify SHA-256 before extraction; reject absolute
archive paths, traversal, and links escaping the extraction directory.
Do not execute unverified content.

Keep builds in separate environment/version directories. Name the candidate
native executable `dino` or `dino-staging` (`.exe` on Windows); its name
selects the environment. Run that candidate's `version` and verify version,
environment, and known build SHA before activation.

Choose a user-writable executable directory and show its absolute path in
installation approval. Verify that the AI editor can resolve the selected
entry there. If its PATH needs refreshing, invoke the absolute native path
with the same executable basename until the editor restarts; do not create a
wrapper. A fresh installation uses approved host download/extraction/file
tools and does not require an existing CLI.

Atomically replace only the selected environment's executable entry: a
symlink on Linux/macOS or native executable copy on Windows. Preserve the
other environment and both workspace directories. Keep the previous binary
until the installed entry passes both checks below. Do not run an installer
that overwrites a shared command, and do not substitute staging API code for
a production binary that lacks environment binding.

### Verify release compatibility

Run the selected executable directly:

```text
dino version
dino version check
dino capabilities
```

Require `version check` to report `data.compatible: true`, the selected
environment, exact required version, and exact build path. Require protocol 1
and the intended capabilities as specified in [SKILL.md](../SKILL.md).

## Register or verify the workspace

One workspace contains `.env` and `agents/`. Credentials remain in that
workspace, while the shared registry holds only names and canonical paths.
Production and staging binaries independently resolve `prod` and `staging`;
the shared registry's active entry must not cross environments.

Inspect local registration with `workspace list` and `workspace current`.
If absent, show the absolute destination and obtain approval for each write:

```text
dino --workspace <absolute-production-workspace> workspace init
```

For staging use `dino-staging`. Before registration, ask the user to enter
their Dino API key directly into the generated private `.env` in their local
editor, then confirm completion without sending the key. Preserve the
generated `VOX_ENVIRONMENT`; those are the only two permitted fields. Never
print or request the key in chat. `credentials import` stores provider keys,
not the Dino account key. There is no implied CLI login endpoint.

Once the key is present, obtain approval to register the workspace:

```text
dino workspace use prod --path <absolute-production-workspace>
```

For staging register `staging` through `dino-staging`. API URLs come
exclusively from the manifest. Do not register an empty-key skeleton.

For an older workspace, read [workspace-migration.md](workspace-migration.md)
before replacement; perform the approved migration without exposing secrets.

Before consequential remote work, inspect all three:

```text
dino workspace list
dino workspace current
dino workspace check
```

Require the intended environment/endpoints, configured API key, and
`registration.registered: true`, the expected `registration.name`, and
`registration.current: true`. A valid directory is not persistent setup
until registered. Complete approved registration rather than repeatedly
passing a one-shot override.

Use absolute global `--workspace` only for a user-requested transient
invocation (or initial setup above); check that exact path first. It must
match the executable's environment and cannot switch environments. Never
silently rebind a workspace name or path; they are one-to-one. Registration
removal does not authorize deleting the directory.

Once these gates pass, use `dino account get` to verify the authenticated
actor. Do not infer their role from an email or credential location.
Workspace setup and account reads do not authorize any later mutation.
