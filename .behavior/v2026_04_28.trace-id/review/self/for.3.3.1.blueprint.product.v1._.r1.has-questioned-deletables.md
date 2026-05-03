# self-review: has-questioned-deletables

review of 3.3.1.blueprint.product.v1.i1.md for deletable features and components.

---

## features review

### feature: genContextLogTrail function

**traces to criteria?** yes — usecase.1 "generate context with trail"

**wisher explicitly asked?** yes — wish says "genContextLogTrail which accepts a trace id"

**verdict: keep**

### feature: trail.exid field

**traces to criteria?** yes — usecase.2 "log output includes trail.exid"

**wisher explicitly asked?** yes — wish says "thread through a traceid on all logs"

**verdict: keep**

### feature: trail.stack field

**traces to criteria?** yes — usecase.3 "stack grows via withLogTrail"

**wisher explicitly asked?** no — this is extant behavior in withLogTrail, not new

**but needed?** yes — stack already exists, we restructure from `string[]` to `{ exid, stack }`

**verdict: keep** — not new feature, just structural change to accommodate exid

### feature: env.commit field

**traces to criteria?** yes — usecase.2 "log output includes env.commit"

**wisher explicitly asked?** yes — wish says "also, commit"

**verdict: keep**

### feature: rename generateLogMethods → genLogMethods

**traces to criteria?** no — not in blackbox criteria

**wisher explicitly asked?** yes — explicitly decided "genLogMethods, cutover to that name"

**verdict: keep**

### feature: zero backcompat for generateLogMethods

**traces to criteria?** no — not in blackbox criteria

**wisher explicitly asked?** yes — explicitly said "zero backcompat"

**verdict: keep**

---

## components review

### component: genContextLogTrail.ts (new file)

**can be removed?** no — this is the core deliverable

**simplest version?** yes — single function, wraps genLogMethods, returns context

**verdict: keep**

### component: LogTrail type change (string[] → { exid, stack })

**can be removed?** no — needed to add exid to trail

**could we just add exid alongside trail?** considered, but wisher approved `trail: { exid, stack }` structure in vision

**verdict: keep**

### component: generateLogMethod changes (accept trail/env)

**can be removed?** no — this is where trail/env gets injected into output

**alternative?** could inject at formatLogContentsForEnvironment level only

**issue found:** do we need to pass trail/env through generateLogMethod, or can genContextLogTrail wrap the final output directly?

**analysis:**
- option A: pass trail/env through generateLogMethod → formatLogContentsForEnvironment
- option B: genContextLogTrail wraps the returned log methods to inject trail/env

option B is simpler — genContextLogTrail can wrap the methods returned by genLogMethods and inject trail/env at call time. no need to modify generateLogMethod or formatLogContentsForEnvironment.

**verdict: SIMPLIFY** — remove changes to generateLogMethod.ts and formatLogContentsForEnvironment.ts

### component: formatLogContentsForEnvironment changes

**removed** — per above analysis, genContextLogTrail handles injection

---

## issues found and fixed

### issue 1: unnecessary changes to generateLogMethod and formatLogContentsForEnvironment

**what was wrong:**
blueprint proposed changes to generateLogMethod.ts and formatLogContentsForEnvironment.ts to accept trail/env parameters and include them in output.

**why it's deletable:**
genContextLogTrail can wrap the log methods returned by genLogMethods and inject trail/env at the wrapper level. the wrapped methods call formatLogContentsForEnvironment with the trail/env included in the formatted output.

actually, wait — formatLogContentsForEnvironment needs to know about trail/env to include it in the output structure. the wrapper alone doesn't solve this.

**re-analysis:**
- genContextLogTrail wraps log methods
- each wrapped method calls the original log method
- but the original log method calls formatLogContentsForEnvironment
- formatLogContentsForEnvironment doesn't know about trail/env

**options:**
1. modify generateLogMethod to accept trail/env
2. have genContextLogTrail call console directly with formatted output
3. have genContextLogTrail create new log methods that call formatLogContentsForEnvironment directly

option 1 is cleanest — pass trail/env through the chain.

**verdict: RETAIN original blueprint** — the modification to generateLogMethod and formatLogContentsForEnvironment is needed.

---

## final assessment

no deletables found. all features trace to wish or criteria. component changes are the minimal set needed.

| item | verdict | rationale |
|------|---------|-----------|
| genContextLogTrail function | keep | core deliverable, wisher requested |
| trail.exid field | keep | wisher requested traceid |
| trail.stack field | keep | extant behavior, structural change only |
| env.commit field | keep | wisher requested commit |
| rename to genLogMethods | keep | wisher explicitly approved |
| zero backcompat | keep | wisher explicitly approved |
| generateLogMethod changes | keep | needed to inject trail/env |
| formatLogContentsForEnvironment changes | keep | needed to output trail/env |
