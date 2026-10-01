# Accounts

Follow [SKILL.md](../SKILL.md) for environment, protocol, secrets, and approval.
Examples use production `dino`; use `dino-staging` for staging. Each mutation
requires its own approved capability confirmation, including retries.

## Inspect the account and export billing data

Fetch the authenticated actor:

```text
dino account get
```

Export a bounded connected-minutes statement for a billable Client or Account
Manager:

```text
dino account billing-statement --from <YYYY-MM-DD> --to <YYYY-MM-DD> --output <absolute-csv>
```

Add `--overwrite` only when replacement of that exact output file is intended.
Do not treat the statement as a pricing-administration surface.

## Provision a Client with enterprise password login

Use Account Manager authentication. Confirm the Client's email, name, region,
fixed Preview destination, Widget concurrency, and one source resource of each
required kind. The phone number and Preview DID must match the Client
region. DID and partner credential source IDs must be owned by or granted to
the provisioning Account Manager. The Dino server must be Ops-managed and
granted to that Account Manager. Ping onboarding does not use Client-provided
infrastructure for Preview.

Before requesting mutation approval, disclose the complete account policy:
default regional Client pricing, `prepaid` billing, zero overdraft, zero
opening balance, and the requested Widget concurrency. Also show the fixed
destination and every source resource ID. These are the exact onboarding
inputs:

```text
dino account get
dino account provision-client \
  --email <client-email> \
  --name <client-name> \
  --region <in|us> \
  --preview-phone <approved-e164> \
  --concurrency <1-255> \
  --preview-did-id <source-did-uuid> \
  --preview-partner-credential-id <source-partner-uuid> \
  --preview-vox-server-id <source-vox-server-uuid>
```

Repeat each Preview resource flag to include additional resources of that
kind in the same atomic docket. These are source resource IDs; a later call
uses the returned Client allocation ID and selected resources from its catalog.

The operation creates the Client in the caller's book with default Ping
access, provisions the default account, materializes the requested Widget
capacity, creates one Client-owned Preview docket from the resource sets,
stores the Preview destination, and sends a password-setup link. It never
creates or returns an API key. Check the returned `passwordSetupEmail` value.
An exact retry with the same identity, concurrency, and resource bundle may
finish interrupted provisioning. A retry with changed inputs fails instead of
mutating the existing Client.

Do not add account-policy or credit arguments to this command. When a
non-default billing/pricing/capacity policy or an initial credit is requested,
finish this narrow provisioning step first, then hand the returned Client ID
to the approval-gated Ops account workflow. Each mutation requires separate
approval.

Do not place a preview call as part of provisioning. Follow the separate
two-actor Client preview recipe only after the Client completes password setup
and the user approves a real call.
