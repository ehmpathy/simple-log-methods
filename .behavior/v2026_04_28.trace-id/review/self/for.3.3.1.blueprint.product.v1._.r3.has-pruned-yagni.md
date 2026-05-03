# self-review: has-pruned-yagni (r3)

third pass review of 3.3.1.blueprint.product.v1.i1.md for YAGNI violations.

fresh eyes. different angle. question all.

---

## angle: what could be removed?

let me invert the question. instead of "was this requested?", ask "what would break if we removed this?"

---

## candidate 1: trail.stack in output

**if removed:**
logs would only contain exid. call depth would be invisible.

**was stack requested?**
no — wisher asked for "traceid on all logs" and "commit". stack was extant behavior.

**is stack YAGNI?**
no — stack is extant functionality. the feature request is "add exid", not "replace stack with exid".

**verdict: keep** — removal would be regression

---

## candidate 2: context.log.trail accessor

**if removed:**
callers could not access current trail state for cross-service propagation.

**was accessor requested?**
yes — usecase.4 in criteria: "context.log.trail is accessed → current trail state is returned"

**verdict: keep** — required for cross-service

---

## candidate 3: env object structure

**if removed (env.commit → just commit field):**
logs would have `commit: 'a1b2c3d'` instead of `env: { commit: 'a1b2c3d' }`

**why env wrapper?**
vision says "env: { commit }" — grouped structure. allows future extension: `env: { commit, stage }` without break.

**is this premature?**
possibly. but the structure was in the vision and wisher approved.

**verdict: keep** — wisher approved structure

---

## candidate 4: null-handle complexity

**current design:**
- exid: null → omit exid field, keep trail.stack
- commit: null → omit entire env object

**simpler alternative:**
- exid: null → omit entire trail object
- commit: null → omit entire env object

**is current design YAGNI?**
the asymmetry exists because:
- stack is useful even without exid (call depth visibility)
- env has only commit, so null commit = empty env = omit

this is not complexity for complexity's sake. it's different semantics for different fields.

**verdict: keep** — asymmetry is semantically correct

---

## candidate 5: changes to formatLogContentsForEnvironment

**could we inject trail/env elsewhere?**
- option A: inject in generateLogMethod (chosen)
- option B: inject in genContextLogTrail wrapper only

option B: genContextLogTrail wraps methods to include trail/env in metadata, not in structured output.

**problem with option B:**
formatLogContentsForEnvironment decides output structure. if trail/env is in metadata, it becomes `metadata: { ..., trail, env }` instead of top-level `trail`, `env` fields.

vision shows trail/env as top-level fields, not nested in metadata.

**verdict: keep** — top-level fields require formatLogContentsForEnvironment change

---

## candidate 6: test count

**are there extra tests?**

test list review against criteria usecases:

| test | traces to |
|------|-----------|
| returns context with log methods | usecase.1 |
| trail.exid in output | usecase.2 |
| env.commit in output | usecase.2 |
| exid=null omits exid | usecase.1 (graceful null handle) |
| commit=null omits env | usecase.1 (graceful null handle) |
| context.log.trail accessor | usecase.4 |
| all log levels | usecase.6 |
| withLogTrail appends to stack | usecase.3 |
| nested withLogTrail produces correct stack | usecase.3 |
| exid preserved through withLogTrail | usecase.3 |

all tests trace to criteria. no YAGNI tests.

**verdict: keep** — test coverage is minimal and traceable

---

## issues found

none. each component either:
1. explicitly requested by wisher
2. required by criteria usecase
3. extant behavior that must be preserved

no speculative features. no premature optimization. no "while we're here" additions.

---

## summary

| candidate | if removed | verdict |
|-----------|------------|---------|
| trail.stack in output | regression | keep |
| context.log.trail accessor | breaks usecase.4 | keep |
| env object structure | wisher approved | keep |
| null-handle asymmetry | semantic correctness | keep |
| formatLogContents changes | required for output | keep |
| test count | all traceable | keep |
