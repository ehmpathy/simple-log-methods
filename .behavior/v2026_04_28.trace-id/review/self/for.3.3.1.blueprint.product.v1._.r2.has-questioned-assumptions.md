# self-review: has-questioned-assumptions (r2)

second pass review of 3.3.1.blueprint.product.v1.i1.md for hidden technical assumptions.

---

## assumption 1: trail/env must flow through extant log chain

**what do we assume?**
trail/env must be passed through generateLogMethod → formatLogContentsForEnvironment.

**what if the opposite were true?**
genContextLogTrail could bypass the extant chain entirely — call console directly with fully formed output.

**evidence:**
generateLogMethod handles: log level filter, timestamp, console method selection (log vs warn). duplicating this logic would violate DRY and create maintenance burden.

**verdict: holds** — extend extant chain, do not duplicate

---

## assumption 2: LogTrail type change from string[] to { exid, stack }

**what do we assume?**
LogTrail type must change shape.

**what if the opposite were true?**
keep LogTrail as string[] and add exid as separate field on ContextLogTrail.log.

**analysis:**
- option A: `trail: { exid, stack }` — cohesive grouping
- option B: `trail: string[]` + `exid: string` — fragmented

trail semantically represents "the identity and path of a request". exid and stack are both parts of this identity. separating them fragments the concept.

**evidence:**
wisher approved grouped structure. vision uses it throughout.

**verdict: holds** — grouped structure is semantically correct

---

## assumption 3: zero backcompat for generateLogMethods rename

**what do we assume?**
we can remove generateLogMethods entirely.

**what if the opposite were true?**
could deprecate with warning, keep for one release cycle.

**evidence:**
wisher explicitly said "zero backcompat". this is a breaking change by design.

**verdict: holds** — wisher decided

---

## assumption 4: env only contains commit

**what do we assume?**
env object only needs commit field.

**what if the opposite were true?**
env could include: stage, region, service name, etc.

**analysis:**
YAGNI — wisher asked for commit, no other fields mentioned. future extensions can add fields to env object without breaking changes (additive).

**evidence:**
wish says "also, commit" — only commit mentioned. other env data is out of scope. can be added later via `env: { commit, stage?, region? }` if needed.

**verdict: holds** — start minimal, extend later

---

## assumption 5: genContextLogTrail wraps genLogMethods internally

**what do we assume?**
genContextLogTrail calls genLogMethods() internally.

**what if the opposite were true?**
could construct log methods from scratch.

**analysis:**
genLogMethods handles: minimal log level filtering, method creation per level. reusing it avoids duplication.

**verdict: holds** — composition over duplication

---

## assumption 6: trail.stack always present even when exid is null

**what do we assume?**
when exid is null, output still includes `trail: { stack: [...] }`.

**what if the opposite were true?**
could omit entire trail object when exid is null.

**analysis:**
stack provides call depth visibility independent of exid. even without a request correlation id, knowing "this log came from [processOrder, validateInventory]" is valuable for debugging.

**evidence:**
r1 review identified this ambiguity and resolved it: include trail.stack always, omit only exid field when null.

**verdict: holds** — stack is independently useful

---

## assumption 7: no validation of exid format

**what do we assume?**
exid can be any string or null — no format validation.

**what if the opposite were true?**
could validate exid matches uuid format, or specific prefix patterns.

**analysis:**
- pro validation: catch malformed ids early
- con validation: restricts caller flexibility, different systems use different id formats (uuid, ulid, request-id prefix, etc.)

**evidence:**
vision examples show various exid formats: 'req_abc123', event.requestContext.requestId, job.id. no single format enforced.

**verdict: holds** — caller owns id format, library stays flexible

---

## assumption 8: formatLogContentsForEnvironment changes are minimal

**what do we assume?**
adding trail/env to formatLogContentsForEnvironment is straightforward extension.

**what if the opposite were true?**
could require restructuring output format entirely.

**evidence:**
extant function already accepts `{ level, timestamp, message, metadata }` and returns structured output. adding `trail` and `env` fields follows same pattern — additive, not restructuring.

**verdict: holds** — additive change, minimal disruption

---

## issues found and fixed

none found in r2 review. all assumptions hold.

---

## summary

| assumption | verdict | rationale |
|------------|---------|-----------|
| use extant log chain | holds | avoid duplication |
| LogTrail type change | holds | cohesive grouping |
| zero backcompat | holds | wisher decided |
| env only contains commit | holds | YAGNI, extend later |
| wrap genLogMethods | holds | composition |
| stack always present | holds | independently useful |
| no exid format validation | holds | caller flexibility |
| minimal formatLogContents changes | holds | additive |
