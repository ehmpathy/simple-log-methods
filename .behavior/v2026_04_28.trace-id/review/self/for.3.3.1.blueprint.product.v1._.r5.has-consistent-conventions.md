# self-review: has-consistent-conventions (r5)

review of 3.3.1.blueprint.product.v1.i1.md for convention consistency.

---

## extant conventions in codebase

### file names

| pattern | examples |
|---------|----------|
| camelCase.ts | generateLogMethods.ts, withLogTrail.ts |
| domain.objects/ | LogTrail.ts, constants.ts |
| domain.operations/ | generateLogMethod.ts |

### function names

| pattern | examples |
|---------|----------|
| verbNoun | generateLogMethods, formatLogContentsForEnvironment |
| withXxx | withLogTrail |
| getXxx | getRecommendedMinimalLogLevelForEnvironment |

### type names

| pattern | examples |
|---------|----------|
| PascalCase | LogMethods, LogTrail, ContextLogTrail |
| interface for contracts | interface LogMethods, interface ContextLogTrail |
| type for aliases | type LogTrail, type LogMethod |

---

## name choice 1: genContextLogTrail

**extant convention**: `generateXxx` (generateLogMethods, generateLogMethod)

**proposed name**: `genContextLogTrail`

**divergence?**
yes — `gen` instead of `generate`

**why diverge?**
wisher explicitly chose this name: "genLogMethods, cutover to that name"

**is this a problem?**
no — wisher's explicit choice overrides extant convention. library evolves to shorter prefix.

**verdict: correct** — wisher's explicit choice

---

## name choice 2: genLogMethods

**extant convention**: `generateLogMethods`

**proposed name**: `genLogMethods`

**divergence?**
yes — same as above

**why diverge?**
wisher explicitly requested rename

**verdict: correct** — wisher's explicit choice

---

## name choice 3: trail.exid

**extant convention**: none — new field

**similar patterns in codebase?**
- LogLevel enum uses short names (ERROR, WARN, INFO, DEBUG)
- no "externalId" or "exid" precedent

**is exid clear?**
exid is ehmpathy convention for "external identifier". may not be clear to new readers.

**alternatives considered:**
- `requestId` — too specific (could be job id, event id)
- `correlationId` — too long
- `traceId` — conflicts with "trace" verb
- `exid` — generic, short, follows ehmpathy conventions

**verdict: correct** — follows ehmpathy name patterns

---

## name choice 4: trail.stack

**extant convention**: `LogTrail` was `string[]` — represented the stack

**proposed name**: `trail.stack`

**divergence?**
no — `stack` is explicit about what the array represents

**is stack clear?**
yes — call stack is universally understood term

**verdict: correct** — clearer than before

---

## name choice 5: env.commit

**extant convention**: none — new field

**similar patterns in codebase?**
no environment/deploy info in extant code

**is commit clear?**
yes — git commit sha is the obvious interpretation

**alternative considered:**
- `commitSha` — more explicit but redundant (commit implies sha)
- `version` — too vague (semver? build number?)
- `commit` — clear, concise

**verdict: correct** — clear and concise

---

## file name choice: genContextLogTrail.ts

**extant convention**: camelCase.ts that matches function name

**proposed name**: genContextLogTrail.ts

**divergence?**
no — follows extant pattern of filename = function name

**verdict: correct** — follows extant convention

---

## test file names

**extant convention**: xxx.test.ts collocated with xxx.ts

**proposed names**:
- genContextLogTrail.test.ts
- generateLogMethod.test.ts (extend extant)
- formatLogContentsForEnvironment.test.ts (extend extant)

**divergence?**
no — follows extant pattern

**verdict: correct** — follows extant convention

---

## type changes

### LogTrail

**extant**: `type LogTrail = string[]`
**proposed**: `type LogTrail = { exid: string | null; stack: string[] }`

**divergence from extant pattern?**
no — ContextLogTrail already uses object shape
yes — LogTrail was previously array, now object

**is this a convention break?**
no — it's a type evolution. types evolve when requirements change.
the change is documented in blueprint.

**verdict: correct** — type evolution, not convention break

### ContextLogTrail

**extant**: `{ log: LogMethods & { trail?: LogTrail } }`
**proposed**: same structure, LogTrail type changes internally

**divergence?**
no — interface structure unchanged

**verdict: correct** — interface structure preserved

---

## issues found

none. all names either:
1. follow extant conventions
2. diverge with wisher's explicit approval (gen prefix)
3. introduce new terms for new concepts (exid, stack, commit)

---

## summary

| name | extant convention | proposed | verdict |
|------|-------------------|----------|---------|
| genContextLogTrail | generateXxx | genXxx | correct (wisher choice) |
| genLogMethods | generateLogMethods | genLogMethods | correct (wisher choice) |
| trail.exid | n/a (new) | exid | correct (ehmpathy convention) |
| trail.stack | n/a (new) | stack | correct (clear term) |
| env.commit | n/a (new) | commit | correct (clear term) |
| genContextLogTrail.ts | function.ts | genContextLogTrail.ts | correct |
| test files | xxx.test.ts | same | correct |
| LogTrail type | type alias | object type | correct (evolution) |
