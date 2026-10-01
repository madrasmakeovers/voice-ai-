---
docVersion: "1.2.0"
docUpdated: "2026-09-06"
---

# Contract and call errors

Use the error code to identify the required correction before you repeat an operation.

## Artifact rejection

| Code | Required action |
|---|---|
| `unsupported_flow_contract` | Upgrade the flow to the supported contract. Validate and publish the agent again. |
| `unsupported_plugin_contract` | Upgrade the plugin source and rebuild the Component for the supported contract. |
| `flow_invalid` | Correct the flow structure or semantics. Run local validation. |
| `plugin_invalid` | Correct the plugin manifest or Component interface. Rebuild and validate the plugin. |

Contract rejection responses use HTTP 422. Version mismatch details contain `declaredVersion` and `supportedVersion`.
The CLI preserves separate flow and plugin error codes. These errors are not automatically retryable.

The backend compares versions with compiled constants. The environment manifest advertises those versions; it does not override them.
See [contract versions](contracts.md) for the clean-slate baseline and future migration procedures.

## Call outcomes

| Status | Owner of the failure |
|---|---|
| `failure_p` | AI partner |
| `failure_t` | Carrier or telephony transport |
| `failed` | Platform, infrastructure, configuration, admission, or runtime |

Command call details include `reasonCode` and `reasonMessage` when a failure reason is recorded.
Preview and Experience status and history responses include the same fields.
Drip callbacks use their existing snake-case contract and include `reason_code` when a reason is recorded. Normal outcomes omit this field.
Lens derives the displayed failure reason from the archived termination reason.

The carrier boundary preserves explicit authentication and dial rejection reasons.
A bare proxy status or an uncertain network response does not prove that the carrier rejected a call.
The existing callback and lease watchdog determine that call's eventual outcome; this adds no retry loop.

An HTTP rejection before admission is not a completed call. An integration execution failure does not automatically fail the whole call.
Busy, no-answer, DND, silence, and user-unresponsive behavior remain unchanged.

## Safe reporting

Customer messages must not contain credentials, provider payloads, SQL, internal addresses, or filesystem paths.
Use the call ID or request ID when you report a failure. Keep the original cause if cleanup also fails.

## Billing limitation

Call admission can return HTTP 402 when billing policy blocks a call.
The CLI currently reports this as `server_failure`.
Billable API requests also return empty HTTP 402 when the prepaid account has no positive balance.
Overdraft accounts receive empty HTTP 402 at or below their negative overdraft limit. Postpaid admission remains allowed.
Wallet lookup failures return empty HTTP 503. Rejected requests do not execute or create API charges.
An admitted operation or concurrent requests can still exceed spending limits because API charges are asynchronous. Hard-limit enforcement remains pending.
