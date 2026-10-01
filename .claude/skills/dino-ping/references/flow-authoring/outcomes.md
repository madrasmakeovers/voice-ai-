---
docVersion: "1.0.0"
docUpdated: "2026-09-12"
---

# Stage outcomes & guidance

A flow is a map of **stages**, with readable keys before conversion or UUID keys after conversion. A stage holds an
`instruction` (authored task), an `outcomes` object with exactly `success` and `failure`,
and a `toolPolicy` allow-list.

```jsonc
"collect_id": {
  "instruction": "Greet the caller and ask for their unique ID...",
  "bargeIn": false,
  "outcomes": {
    "success": { ... },
    "failure": { ... }
  },
  "toolPolicy": { "tools": [] }
}
```

Follow the [stage-key rules](../flow-authoring.md#required-declarations) when creating or editing a flow.
For integration tools, create each stable UUID v7 with `dino integration new-id`.

## The outcome actions

There are four outcome `type`s — `route`, `end`, `end_then_post`, `dispatch`. Each of
`success` / `failure` names one. Only `route` authors no guidance.

### 1. `route` — go to another stage (no guidance authored)

```jsonc
"success": { "type": "route", "target": "lookup" }
```

The model receives the **target stage's `instruction`** as its next message. This is the
normal "step done → next step." `target` must name an existing stage.

### 2. `end` — close after a final line

```jsonc
"failure": {
  "type": "end",
  "next_instructions": "Give a brief, polite closing based on the reason in evidence. Thank them and say goodbye."
}
```

`next_instructions` is **guidance** — the closing line the model speaks, then the call tears down.

### 3. `end_then_post` — close after a final line, then run a wrap-up turn

```jsonc
"success": {
  "type": "end_then_post",
  "next_instructions": "Say a concise positive closing, thank them, then follow the post instructions.",
  "post": "record"
}
```

`end_then_post` is a **distinct terminal `type`** (not `end` with an optional field), so a
post-bearing close is explicit and a plain `end` can never carry a dangling post id. `post` is
**required** here and names a key in the flow's top-level `posts` object. After the closing
line, the post turn runs (e.g. `record_outcome` + `call_summary` capture tools); the post
declares its own `toolPolicy.tools`.

### 4. `dispatch` — choose 1-of-N sub-flows

```jsonc
"success": {
  "type": "dispatch",
  "routes": [ { "keys": ["upi","payment","refund"], "target": "<stageId>" }, ... ],
  "fallback": "The caller's problem did not map to a category. Choose the closest keyword...",
  "max_misses": 3
}
```

The model emits a `selector` keyword; the harness matches it to a route. `max_misses` (**required**,
`1`–`5`) is how many consecutive misses are tolerated before the harness gives up and takes this
stage's `failure` edge. See `dispatch.md`.

## `instruction` vs `next_instructions` — the key distinction

| Field | Type | Who writes it | When the model sees it |
|---|---|---|---|
| `persona` | authored prose | author | once, at call start (systemInstruction) |
| stage `instruction` | authored prose | author | at start (start stage) or when **routed into** the stage |
| post `instruction` | authored prose | author | when the post turn runs |
| outcome `next_instructions` (end/post) | **guidance** | author | as the closing line for that outcome |
| dispatch `fallback` | **guidance** | author | injected when the selector is missing or unmatched |
| dispatch `max_misses` | integer `1`–`5` | author | give-up threshold; on the Nth consecutive miss the stage's `failure` edge fires |
| typed `next` validation correction | **guidance** | runtime validator | when `next` arguments are malformed or the outcome label is not `success`/`failure` |

"Guidance" = a short runtime nudge the harness injects to steer the model. Authored prose =
the conversation plan. On a `route` success you write **no** guidance — the next stage's
`instruction` is the guidance the model gets.

## Rules the validator enforces

- `start` and route/dispatch targets must reference existing stage keys.
- `outcomes` has exactly `success` and `failure`.
- Do not author `invalidOutcome` or `tools.next.policy.invocation.arguments`; invalid `next` calls return the typed validator's precise correction.
- A declared (non-`next`) tool may only be called on a stage that lists it in `toolPolicy.tools`.
- `post` targets must exist in `posts`.

## Reject ≠ failure

- A **`failure` outcome** is a *successful* `next` call (`success: true` on the wire) that routes
  down the stage's failure edge.
- A **rejection** (bad `next` arguments -> typed validation correction; dispatch miss ->
  selector retry guidance; tool not allowed) keeps the model on the **same** stage to retry.

Author routing guidance for the dispatch case; typed validation owns malformed arguments.
