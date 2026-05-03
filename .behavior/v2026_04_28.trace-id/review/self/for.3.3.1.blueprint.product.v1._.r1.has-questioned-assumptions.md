# self-review: has-questioned-assumptions

review of 3.3.1.blueprint.product.v1.i1.md for hidden technical assumptions.

---

## assumption 1: trail/env injection via generateLogMethod chain

**what do we assume?**
that trail/env must pass through generateLogMethod → formatLogContentsForEnvironment.

**what if the opposite were true?**
genContextLogTrail could construct log methods that directly call console with the full formatted output, and bypass generateLogMethod entirely.

**evidence:**
generateLogMethod does useful work: level filter, timestamp, console method selection. to duplicate this in genContextLogTrail would be wasteful.

**verdict: holds** — reuse extant chain, extend it with trail/env params

---

## assumption 2: LogTrail type must change from string[] to { exid, stack }

**what do we assume?**
that we must restructure LogTrail to include exid.

**what if the opposite were true?**
could keep LogTrail as string[] and add a separate `exid` field on ContextLogTrail.log.

**analysis:**
- option A: `log.trail: { exid, stack }` — grouped, single property
- option B: `log.trail: string[]` + `log.exid: string` — separate properties

option A is cleaner because trail is a cohesive concept (the request's identity + path). to separate exid from stack fragments the trail concept.

**evidence:**
vision uses `trail: { exid, stack }` structure throughout. wisher approved this in conversation.

**verdict: holds** — grouped structure is semantically correct

---

## assumption 3: generateLogMethods needs rename to genLogMethods

**what do we assume?**
that we must rename the function.

**what if the opposite were true?**
could keep generateLogMethods and just add genContextLogTrail.

**evidence:**
wisher explicitly said "genLogMethods, cutover to that name" and "zero backcompat".

**verdict: holds** — wisher explicitly requested

---

## assumption 4: genContextLogTrail returns ContextLogTrail shape

**what do we assume?**
that the return type should be ContextLogTrail.

**what if the opposite were true?**
could return a different type, e.g., just LogMethods with trail attached.

**evidence:**
vision says "genContextLogTrail returns ContextLogTrail shape" and function name implies this. extant codebase uses ContextLogTrail type for context.log patterns.

**verdict: holds** — aligns with extant patterns and name convention

---

## assumption 5: withLogTrail continues to own stack append

**what do we assume?**
that withLogTrail should continue to manage the stack, not genContextLogTrail.

**what if the opposite were true?**
genContextLogTrail could own both exid and stack, with withLogTrail made obsolete.

**analysis:**
withLogTrail does more than stack management:
- logs input/output/error
- handles duration thresholds
- prefixes messages with procedure name

these are orthogonal to exid injection. separation of concerns is correct.

**evidence:**
vision says "genContextLogTrail owns exid inject. withLogTrail owns stack append."

**verdict: holds** — separation of concerns is correct

---

## assumption 6: env.commit omitted when null (not included as null)

**what do we assume?**
that null fields should be omitted from log output.

**what if the opposite were true?**
could include `env: { commit: null }` in output.

**analysis:**
- omit: cleaner logs, less noise
- include: explicit that commit was unknown

**evidence:**
vision says "env.commit — only include when provided. omit field when null (cleaner logs)". wisher explicitly answered this question.

**verdict: holds** — wisher explicitly decided

---

## assumption 7: trail.exid omitted when null (entire trail object)

**what do we assume?**
that when exid is null, we omit the entire trail object.

**wait, re-read vision:**
vision says "if trail.exid: null, logs work without exid field. no throw."

does this mean:
- option A: omit entire `trail` object when exid is null
- option B: include `trail: { stack: [...] }` but omit `exid` field

**analysis:**
option B is more useful — we still want to see the stack even when exid is unknown.

**issue found:** blueprint doesn't clarify this. need to specify behavior.

**verdict: UPDATE blueprint** — when exid is null, include `trail: { stack }` without exid field, not omit entire trail

---

## assumption 8: single file for genContextLogTrail

**what do we assume?**
that genContextLogTrail should be its own file.

**what if the opposite were true?**
could add it to generateLogMethods.ts (now genLogMethods.ts).

**analysis:**
single responsibility: genLogMethods creates bare methods, genContextLogTrail creates context with trail/env. different concerns.

**verdict: holds** — separate files for separate concerns

---

## issues found and fixed

### issue 1: unclear behavior when trail.exid is null

**what was wrong:**
blueprint didn't specify whether to omit entire trail object or just exid field.

**resolution:**
when exid is null, include `trail: { stack: [...] }` without exid field. the stack is still valuable for call depth visibility.

**action:** clarify in blueprint output structure section.

---

## summary

| assumption | verdict | rationale |
|------------|---------|-----------|
| inject via generateLogMethod chain | holds | reuse extant chain |
| LogTrail restructure to { exid, stack } | holds | grouped structure correct |
| rename to genLogMethods | holds | wisher requested |
| return ContextLogTrail shape | holds | aligns with extant patterns |
| withLogTrail owns stack | holds | separation of concerns |
| omit env.commit when null | holds | wisher decided |
| behavior when exid null | **updated** | include trail.stack, omit exid field |
| single file for genContextLogTrail | holds | single responsibility |
