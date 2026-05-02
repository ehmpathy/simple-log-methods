# self-review: has-consistent-conventions (r6)

sixth pass review of 3.3.1.blueprint.product.v1.i1.md for convention consistency.

different angle: what would surprise a contributor who knows the codebase?

---

## contributor perspective

someone familiar with this codebase would expect:
1. functions that create things are named `generateXxx`
2. functions that wrap procedures are named `withXxx`
3. types are PascalCase in domain.objects
4. operations are camelCase in domain.operations
5. tests are collocated with source files

let me check each against the blueprint.

---

## surprise 1: genXxx instead of generateXxx

**what contributor expects**: `generateContextLogTrail`, `generateLogMethods`
**what blueprint proposes**: `genContextLogTrail`, `genLogMethods`

**would this surprise them?**
yes — extant code uses `generate` prefix consistently

**why is this acceptable?**
wisher explicitly chose the new convention. this is intentional evolution, not oversight.

**what should happen?**
- the rename should be documented in release notes
- future functions should use `gen` prefix for consistency

**verdict: acceptable surprise** — intentional evolution

---

## surprise 2: LogTrail is now an object, not array

**what contributor expects**: `context.log.trail.length`, `context.log.trail[0]`
**what blueprint proposes**: `context.log.trail.exid`, `context.log.trail.stack`

**would this surprise them?**
yes — fundamental type shape change

**why is this acceptable?**
- the wish requires exid added to trail
- grouped structure `{ exid, stack }` is semantically correct
- trail as `string[]` was always an implementation detail

**what should happen?**
- release notes should explain the type change
- migration guide: `trail.length` → `trail.stack.length`

**verdict: acceptable surprise** — documented type evolution

---

## surprise 3: new fields in log output

**what contributor expects**: `{ level, timestamp, message, metadata }`
**what blueprint proposes**: `{ level, timestamp, message, metadata, trail, env }`

**would this surprise them?**
maybe — log output gains new top-level fields

**why is this acceptable?**
- additive change, not destructive
- extant fields preserved
- new fields are optional (trail always present, env only when commit provided)

**what should happen?**
- release notes should document new output fields

**verdict: acceptable surprise** — additive change

---

## surprise 4: env structure instead of flat commit field

**what contributor expects**: could be `{ ..., commit: 'abc123' }`
**what blueprint proposes**: `{ ..., env: { commit: 'abc123' } }`

**would this surprise them?**
possibly — extra nested structure

**why is this acceptable?**
- vision specifies `env: { commit }` structure
- allows future extension: `env: { commit, stage, region }`
- wisher approved this structure

**verdict: acceptable** — follows vision structure

---

## surprise 5: genContextLogTrail returns ContextLogTrail

**what contributor expects**: function named `genContext*` returns context
**what blueprint proposes**: `genContextLogTrail` returns `ContextLogTrail`

**would this surprise them?**
no — name clearly indicates return type

**verdict: no surprise** — name matches return type

---

## surprise 6: withLogTrail internal change

**what contributor expects**: withLogTrail works the same externally
**what blueprint proposes**: withLogTrail adapts to new trail shape internally

**would this surprise them?**
no — internal change invisible to callers

**verdict: no surprise** — internal change only

---

## convention audit: do any names violate ehmpathy standards?

### ubiqlang check

| term | clear? | alternatives considered |
|------|--------|------------------------|
| trail | yes | path, trace, breadcrumb |
| exid | yes (ehmpathy) | correlationId, requestId |
| stack | yes | path, chain, history |
| commit | yes | sha, version, hash |
| env | yes | context, deploy, runtime |

all terms are clear within ehmpathy vocabulary.

### treestruct check

| name | follows [verb][...noun]? |
|------|-------------------------|
| genContextLogTrail | yes: gen + Context + LogTrail |
| genLogMethods | yes: gen + LogMethods |

names follow treestruct convention.

---

## issues found

none. all proposed names and patterns either:
1. follow extant conventions
2. diverge intentionally with wisher approval
3. follow ehmpathy vocabulary standards

surprises are documented and acceptable.

---

## summary

| aspect | surprise level | acceptable? |
|--------|---------------|-------------|
| gen prefix | mild | yes (wisher choice) |
| LogTrail type shape | moderate | yes (documented) |
| new log output fields | mild | yes (additive) |
| env structure | mild | yes (vision spec) |
| genContextLogTrail return | none | yes |
| withLogTrail internal | none | yes |
