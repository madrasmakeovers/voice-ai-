# Dispatch (1-of-N routing)

A `dispatch` outcome turns one stage into a router: the model classifies the caller's intent
into one keyword, and the harness deterministically routes to the matching sub-flow stage.
Use it for triage (e.g. a helpline that fans out to UPI / login / recharge / fare).

## Shape

```jsonc
"success": {
  "type": "dispatch",
  "routes": [
    { "keys": ["upi", "payment", "refund"], "target": "upi_info" },
    { "keys": ["login", "signin", "otp"],   "target": "login_info" },
    { "keys": ["recharge", "wallet"],        "target": "recharge_info" },
    { "keys": ["fare", "price", "charge"],   "target": "fare_info" }
  ],
  "fallback": "The caller's stated problem did not map to a category. Choose the closest keyword for what they already told you; only report failure if it genuinely fits none.",
  "max_misses": 3
}
```

- `routes`: ordered; **first route with any matching key wins**.
- `keys`: the selector aliases for that route. A **list** (not one word) absorbs model wording
  variation — this is the main robustness lever. Every key must be non-empty and unique across
  the whole dispatch.
- `target`: the **name** of the stage to route to.
- `fallback`: short retry guidance injected when the selector is missing or does not match a
  route. Keep it crisp and tell the model how to choose one valid selector.
- `max_misses`: **required**, integer `1`–`5`. How many consecutive misses the harness tolerates
  before it gives up and takes the stage's `failure` edge (see resolve step 4). Omitting it or a
  value outside `1`–`5` fails validation.

## The model must emit a `selector` — use the dispatch `next` schema

If any stage outcome uses `"type": "dispatch"`, copy
`assets/flow-authoring/next-dispatch.schema.json` into
`flow.tools.next.schema`. That is still
the single system tool named `next`; the schema only adds optional `selector`.

The dispatch stage's `instruction` must tell the model the exact keywords to
use. The harness does **not** auto-inject `selector`; you author it.

In the dispatch stage's `instruction`:

> "...silently classify their reason. When confident, call next with outcome success and set
> selector to exactly one of: `upi` for a payment/refund problem; `login` for sign-in/OTP
> trouble; `recharge` for wallet top-up; `fare` for a trip-price question."

Do **not** read the categories aloud; the model classifies silently.

## How the harness resolves it (deterministic)

1. **Normalize** the selector: lowercase + collapse whitespace.
2. **First-match** against `routes` by normalized key. Match → route to that `target`; the
   target stage's `instruction` is delivered.
3. **Miss** (selector absent or no key matches) -> inject this dispatch edge's `fallback`
   guidance and **keep the model on the stage** to retry. This is a rejection
   (`success:false`), not a dead-end.
4. **Escalate**: after **`max_misses`** consecutive misses (the value you authored, `1`–`5`) the
   harness stops re-guiding and takes the stage's own `failure` edge — so chronic
   misclassification becomes a visible failure, not an endless loop. (Author a sensible `failure`
   outcome; it is where a give-up lands.)

## Mixing

Dispatch is per-outcome, not a flow mode. A stage's `success` can be `dispatch` while
`failure` is `end`; other stages can be pure `route`/`end`/`end_then_post`/`dispatch`. A sub-flow stage can itself
dispatch again (e.g. UPI → "which UPI issue?"). Pure binary flows need no `selector` at all.

## Checklist

- [ ] `selector` declared in the `next` schema, with a "use only when instruction lists keywords" description.
- [ ] Dispatch stage `instruction` lists the exact keywords and what each means.
- [ ] Every route `target` names an existing stage; keys unique across routes.
- [ ] `fallback` written as a short fallback note.
- [ ] `max_misses` set to an integer `1`–`5` (the give-up threshold; required).
- [ ] The stage's `failure` outcome is meaningful (it is the escalation path).

See F03 and F04 under `agents/` for complete single-level and nested
routers.
