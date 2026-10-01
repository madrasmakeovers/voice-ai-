# Flow-local tools: `memory` and `capture`

Two tools the **flow services itself** in-process — no integration, no network, no
plugin. Both are declared with `"dispatch": { "kind": "flow_local", "handler": ... }`
and, like every declared tool, are gated by each stage's `toolPolicy.tools`.
Their corrective guidance lives in `tools.<name>.policy`, the same common policy
shape used by integrations and `next`.

They look similar but solve opposite problems. Pick by **direction**:

| | `memory` | `capture` |
|---|---|---|
| `handler` | `"memory"` | `"capture"` |
| Contract | `{ action: "read" \| "write", content }` | any object you define |
| What it does | `write` appends `content` to an in-call list; `read` returns the whole list back to the model | records the args as a `Captured` event in the flow log, returns an empty ack |
| Direction | **two-way** — the model can read back what it wrote | **one-way** — the model cannot read it back |
| Lives | for the whole call (cross-stage) | dropped into the call record |
| Use for | accumulating facts the model needs **later in the same call** | reporting a final structured outcome for analytics and campaigns |

The model can never read a `capture` back — so if a later turn (e.g. a post) must
**use** the data, it has to be in `memory`, not `capture`. They compose: `memory`
holds the facts during the call, `capture` reports the disposition at the end.

New ordinary tools use conservative authoring defaults: one accepted call per
stage (`policy.invocation.repeat.mode: "once"`) and rejection of an overlapping call
(`policy.invocation.concurrency.mode: "reject"`). These are declaration defaults, not runtime
constants: an author may explicitly choose a looser policy when repeat or overlap
is genuinely safe. `memory` is the common deliberate exception because collecting
several facts requires several writes.

---

## `memory` — the multi-item collection pattern

**The problem it fixes.** When one stage asks the caller for several discrete facts
(mobile, app version, device, issue type, error message…), a model with nothing to
write to will **spam the gated integration tools** trying to "record" each item as it
hears it — every call rejected by `toolPolicy`, cluttering the trace and burning turns.
This shows up live as a wall of rejected tool calls on a collection stage.

**The fix.** Declare a `memory` tool, gate the collection stage to **only** `memory`,
and tell the model to write each item the moment it has it — one write per item.

Tool declaration:

```jsonc
"memory": {
  "dispatch": { "kind": "flow_local", "handler": "memory" },
  "policy": {
    "invocation": {
      "repeat": {
        "mode": "unlimited"
      },
      "concurrency": {
        "mode": "reject",
        "inFlight": "A memory action is already being handled. Wait for it before calling memory again."
      }
    },
    "async": {
      "mode": "none"
    }
  },
  "schema": {
    "name": "memory",
    "description": "Record or recall call notes. Use action write with content to append one note the moment you learn it; action read returns everything recorded so far.",
    "parameters": {
      "type": "object",
      "properties": {
        "action":  { "type": "string", "enum": ["read", "write"], "description": "write appends one note; read returns all notes recorded so far." },
        "content": { "type": "string", "description": "The note to record. Required when action is write." }
      },
      "required": ["action"]
    }
  }
}
```

Collection stage:

```jsonc
"collect_context": {
  "instruction": "Collect three things one at a time and record each the moment you get it by calling memory with action write (one write per item): registered mobile, app version, and official-app confirmation. Use only memory on this stage. Succeed when all three are recorded; fail for refusal or silence after one re-ask.",
  "outcomes": { "success": { "type": "route", "target": "..." }, "failure": { "type": "end", "next_instructions": "..." } },
  "toolPolicy": { "tools": ["memory"] }
}
```

Notes that make it work:
- **One write per item**, "the moment you get it" — not one batched write at the end.
  The point is to give the model somewhere to put each fact *as it arrives*.
- **Gate the stage to `["memory"]`** and say "use only memory on this stage" so the
  model can't reach for an integration tool it shouldn't call yet.
- Succeed on *"all recorded"*, not *"all known"* — phrasing the objective around the
  writes keeps the model writing instead of holding facts in its head.
- `memory` is **always safe to make available** — it has no external side effects. It is also the only
  reliable way for a **post** to see facts collected several stages earlier.

---

## `capture` — the reporting sink for posts

A terminal post often relays a CRM note via a **fire-and-forget** `integration`
(e.g. `log_kapture_note`). That relay leaves the call; the model can't see its result
and neither can later analytics. To also drop a clean, structured disposition into the
**call log** — for campaign targeting, dashboards, and evaluation — add a `capture` tool and
call it once in the post.

```jsonc
"record_outcome": {
  "dispatch": { "kind": "flow_local", "handler": "capture" },
  "policy": {
    "invocation": {
      "arguments": {
        "invalid": "The outcome fields do not match the capture schema. Re-check required fields and call record_outcome again."
      },
      "repeat": {
        "mode": "once",
        "exceeded": "The final outcome has already been recorded for this step. Do not call record_outcome again."
      },
      "concurrency": {
        "mode": "reject",
        "inFlight": "An outcome capture is already being handled. Wait for it before calling record_outcome again."
      }
    },
    "async": {
      "mode": "none"
    }
  },
  "schema": {
    "name": "record_outcome",
    "description": "Log the final structured disposition of this call for reporting. Call once in the terminal post, after the CRM note.",
    "parameters": {
      "type": "object",
      "properties": {
        "issue_type":        { "type": "string", "enum": ["..."], "description": "The issue handled." },
        "resolution_status": { "type": "string", "enum": ["resolved", "escalated", "unresolved"], "description": "Final disposition." },
        "registered_mobile": { "type": "string", "description": "Used for campaign targeting." },
        "summary":           { "type": "string", "description": "One-line outcome built from the recalled notes." }
      },
      "required": ["issue_type", "resolution_status", "registered_mobile", "summary"]
    }
  }
}
```

`capture` schemas commonly omit `response` — there is nothing to wait for; the call is
serviced into the log and acked immediately.

### The post sequence: read → relay → capture

A post that wraps up a fact-collecting call does three things, and its `toolPolicy`
allows all three plus `memory`:

```jsonc
"log_case": {
  "instruction": "First call memory with action read to recall the details collected during the call. Then call log_kapture_note once with the recalled registered mobile, resolution_status from the transcript, and notes built from the recalled details. Finally call record_outcome once with the same issue_type, resolution_status, and mobile, plus a one-line summary.",
  "timeoutSecs": 20,
  "toolPolicy": { "tools": ["memory", "log_kapture_note", "record_outcome"] }
}
```

This is why the upstream stages must **write to `memory`**: the post reads it back to
build both the CRM note and the capture. A `capture` upstream would be invisible here.

---

## Where each lives in the flow

- **`memory` write** → on the collection / fact-gathering stages (gated to `["memory"]`).
- **`memory` read** → at the start of a post (or any later stage) that needs the facts.
- **`capture`** → in the terminal post, after the CRM relay, to report the disposition.

## Checklist

- [ ] Collection stage with 3+ discrete facts → declare `memory`, gate to `["memory"]`,
      instruct one write per item, succeed on "recorded".
- [ ] Any later turn that must *use* collected facts → it reads `memory`; the data was
      written there (not `capture`).
- [ ] Post that relays a CRM note → also `capture` a structured `record_outcome` for reporting.
- [ ] `memory`/`capture` listed in `toolPolicy.tools` of every stage/post that calls them.
- [ ] Persona's tool contract names `memory` and `capture` so the model knows they exist.
