# self-review: has-questioned-requirements

review of 1.vision.md for requirement validity.

---

## requirement 1: traceId thread

**who said this was needed?**
the wish explicitly: "we want to make it simple to thread through a traceid on all logs"

**what evidence supports this?**
- standard observability pattern in distributed systems
- cloudwatch/datadog queries become trivial with correlation ids
- concurrent requests for same entity (e.g., orderId) become distinguishable

**what if we didn't do this?**
logs remain uncorrelated. debug of concurrent requests = nightmare grep across concurrent logs.

**scope check:**
appropriate. just add traceId, don't build full opentelemetry. the wish explicitly says "not span ids or parent-child relationships".

**simpler way?**
could encourage manual `{ traceId }` in every log call... but that defeats "simple" in simple-log-methods.

**verdict: holds** — core requirement, well-scoped

---

## requirement 2: genContextLogTrail function

**who said this was needed?**
the wish: "genContextLogTrail which accepts a trace id"

**what evidence supports this?**
- aligns with (input, context) pattern used throughout ehmpathy codebases
- single injection point at request boundary
- logs inherit traceId automatically downstream

**what if we didn't do this?**
users manually wrap every log call. error-prone, verbose.

**scope check:**
minimal — one function, returns LogMethods shape.

**simpler way?**
could export `withTraceId(log, traceId)` wrapper instead... but genContextLogTrail is a cleaner entrypoint.

**verdict: holds** — explicitly requested, minimal api surface

---

## requirement 3: commit field

**who said this was needed?**
the wish: "also, commit"

**what evidence supports this?**
in incidents, to know which code version was active helps correlate logs to git history.

**what if we didn't do this?**
users grep git history separately after find incident time. extra step, but manageable.

**scope check:**
optional field, low overhead.

**simpler way?**
could auto-detect from `process.env.COMMIT_SHA` instead of explicit input...

**issue found:** the vision shows commit as explicit input, but auto-detection from env var might be simpler and less error-prone.

**verdict: questionable** — the wish says "commit" but doesn't specify explicit vs auto-detection. worth ask to wisher.

---

## requirement 4: tracer object nest `{ tracer: { traceId } }`

**who said this was needed?**
i assumed this for future extensibility (spanId, parentId).

**what evidence supports this?**
opentelemetry has traceId, spanId, parentId. future-proof design.

**what if we didn't do this?**
simpler api now: `genContextLogTrail({ traceId, commit })`. if we add spanId later, it's a flat addition, not nested.

**scope check:**
adds nest complexity that the wish didn't ask for.

**simpler way:**
flat: `genContextLogTrail({ traceId, commit })` instead of `genContextLogTrail({ tracer: { traceId }, commit })`

**issue found:** i over-engineered this. the wish says "tracer" but in the context of "{ tracer, commit } are added as supported fields" — not as a nested object. a flat structure is simpler and still extensible.

**verdict: needs revision** — remove tracer nest, use flat `{ traceId, commit }`

---

## requirement 5: backwards compatibility (two ways to create logs)

**who said this was needed?**
i assumed this — keep generateLogMethods alongside genContextLogTrail.

**what evidence supports this?**
semver compliance, don't break extant users.

**what if we didn't do this?**
a break change. extant users must update their code.

**scope check:**
reasonable for a library.

**simpler way?**
genContextLogTrail could work with optional traceId, effectively a replace for generateLogMethods entirely. one function to learn instead of two.

**issue found:** worth ask to wisher if break change is acceptable or if backwards compat is required.

**verdict: questionable** — depends on semver strategy

---

## summary of issues found

| requirement | verdict | action |
|-------------|---------|--------|
| traceId thread | holds | none |
| genContextLogTrail function | holds | none |
| commit field | questionable | ask wisher: explicit vs auto-detect from env? |
| tracer object nest | needs revision | flatten to `{ traceId, commit }` |
| backwards compatibility | questionable | ask wisher: semver strategy? |

---

## revisions made

### issue fixed: tracer nest removed

**what was wrong:**
i assumed `{ tracer: { traceId } }` for future extensibility, but the wish said `{ tracer, commit }` as flat fields.

**how i fixed it:**
updated 1.vision.md to use flat structure throughout:
- line 34: `genContextLogTrail({ traceId: 'req_abc123', commit: 'a1b2c3d' })`
- line 66: usecase table now shows `{ traceId, commit? }`
- line 78-81: lambda example uses flat `{ traceId, commit }`
- line 105-108: job example uses flat `{ traceId, commit }`
- assumption 3: changed from "tracer object" to "flat structure"
- awkwardness 2: changed from "tracer nest" to "traceId term choice"
- uncomfortable tradeoffs: removed "tracer object adds nest"

**why this matters:**
- simpler api = easier adoption
- wish didn't ask for nest = yagni
- flat structure still extensible (add spanId as peer, not child)

---

## non-issues confirmed

### requirement 1: traceId thread — holds

**why it holds:**
the wish explicitly states "thread through a traceid on all logs". this is the core ask. without it, there's no feature. the scope is correct: just traceId, no opentelemetry spans.

### requirement 2: genContextLogTrail function — holds

**why it holds:**
the wish explicitly names "genContextLogTrail". the function returns LogMethods shape (backwards compatible). it aligns with ehmpathy's (input, context) pattern. alternatives like `withTraceId()` would be less ergonomic at entry points.

---

## additional issues found in deeper review

### issue addressed: ContextLog type undefined

**what i noticed:**
line 38 and 93 use `context: ContextLog` but i never define what ContextLog is.

the extant codebase has `ContextLogTrail` in LogTrail.ts which includes:
- `log: LogMethods & { trail?: LogTrail }`

**how i addressed it:**
- added assumption 5 to vision: "ContextLog type — examples use ContextLog as shorthand for `{ log: LogMethods }`. whether this becomes a formal type or reuses extant ContextLogTrail is TBD with wisher"
- added question 6 to vision: "ContextLog type name? extant type is ContextLogTrail. wish says 'ContextLog'. rename, create new, or both?"

**why this matters:**
type names affect all downstream code. wisher should decide before implementation.

### issue fixed: stale "tracer" reference

**what i noticed:**
line 188 said "should tracer be required or optional?" but i changed all other references to "traceId".

**how i fixed it:**
updated vision line 188 to say "should traceId be required or optional? if optional, should we auto-generate one?"

**why this matters:**
consistency in terminology prevents confusion.

### issue: tracer vs traceId ambiguity in wish

**what i noticed:**
the wish uses both terms:
- "thread through a traceid" (lowercase)
- "tracer must become a toplevel standard"
- "{ tracer, commit } are added as supported fields"

**uncertainty:** does the wish mean:
- option A: `tracer` is the field name, `traceId` is the value within it
- option B: `tracer` and `traceId` are interchangeable terms
- option C: `tracer` is a field with `{ traceId, spanId?, ... }` for extensibility

**my interpretation:** i went with option B (flat `{ traceId, commit }`), but option C (`{ tracer: { traceId }, commit }`) may have been the wisher's intent.

**action needed:** ask wisher to clarify before proceed.

---

## questions deferred to wisher

### commit field: explicit vs auto-detect?

the vision shows explicit input. alternative: auto-detect from `process.env.COMMIT_SHA`.

**my recommendation:** explicit input is safer. env vars may not exist in all deploy environments. caller knows their commit source.

### backwards compatibility: semver strategy?

the vision shows two functions coexist. alternative: replace generateLogMethods entirely.

**my recommendation:** keep both for semver. deprecate generateLogMethods in docs, not in code.

### tracer vs traceId field name?

the wish says "tracer" and "traceid". which should the api use?

**my recommendation:** ask wisher. i assumed traceId (industry term) but they may prefer tracer (shorter, domain-specific).

### ContextLog type name?

extant type is ContextLogTrail. wish says "ContextLog". should we:
- rename ContextLogTrail to ContextLog?
- create a new simpler ContextLog type?
- use both for different purposes?

**my recommendation:** ask wisher. type name affects all downstream code.
