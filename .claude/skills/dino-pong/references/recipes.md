# Choose a Pong workflow

Read [Pong](../SKILL.md) and its required Ping policy before execution.
Examples use `dino`; use `dino-staging` throughout for staging.

| Need | Workflow | Dispatch boundary |
| --- | --- | --- |
| Finite CSV or Google Sheet list | [Create](process-create.md), then [Batch](batch.md) | Import prepares contacts; moving to running can call |
| Continuously inserted outbound contacts | [Create](process-create.md), then [Drip](drip.md) | Running Drip insertion can call immediately |
| Receive calls on a DID | [Inbound creation](process-create.md) | Creation binds the DID until close |
| One Client-owned preview | [Ping](../../dino-ping/SKILL.md) | Client approves one call to its AM-configured fixed destination |
| Interactive assigned agent | [Experience](experience.md) | AM assignment/clone authorizes interactive access |
| Process status, answered calls, post-tools | [Calls](calls.md) | Read-only; bounded, process-scoped |
| Own DID/partner resources or runtime delegation | [Infrastructure](infrastructure.md) | Each write has separate approval |

Do not create disposable processes to test resources; use the read-only probes
in [Process creation](process-create.md). Preview is not ongoing customer
dispatch, and Experience is not a call-record reporting surface.

Load only the chosen workflow and its stated prerequisites. Consult
[API surface](api-surface.md) when an operation identity or scope needs checking;
it is a contract reference, not permission to call HTTP directly.
