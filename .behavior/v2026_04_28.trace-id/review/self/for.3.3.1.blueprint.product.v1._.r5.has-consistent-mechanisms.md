# self-review: has-consistent-mechanisms (r5)

fifth pass review of 3.3.1.blueprint.product.v1.i1.md for mechanism consistency.

different angle: trace the data flow and look for reinvented wheels.

---

## data flow analysis

### extant flow (before change)

```
generateLogMethods()
  └─ generateLogMethod({ level, minimalLogLevel })
       └─ formatLogContentsForEnvironment({ level, timestamp, message, metadata })
            └─ console.log/warn(output)
```

### proposed flow (after change)

```
genContextLogTrail({ trail, env })
  └─ genLogMethods()
       └─ generateLogMethod({ level, minimalLogLevel, trail, env })
            └─ formatLogContentsForEnvironment({ level, timestamp, message, metadata, trail, env })
                 └─ console.log/warn(output)
```

**observation**: the flow extends extant chain. no parallel path created.

---

## mechanism 1: genContextLogTrail

**what it creates**: context with log methods that auto-inject trail/env

**could we use extant components?**

option A: compose (chosen)
```ts
const genContextLogTrail = ({ trail, env }) => {
  const baseMethods = genLogMethods();
  const wrappedMethods = wrapMethodsToInjectTrailEnv(baseMethods, trail, env);
  return { log: { ...wrappedMethods, trail } };
};
```

option B: duplicate
```ts
const genContextLogTrail = ({ trail, env }) => {
  // duplicate all of generateLogMethod logic here
  return { log: { error: ..., warn: ..., info: ..., debug: ..., trail } };
};
```

blueprint chooses option A. correct.

**does wrapMethodsToInjectTrailEnv exist?**
no — this is the new logic. but it's a thin wrapper, not a parallel mechanism.

**verdict: correct** — composes, not duplicates

---

## mechanism 2: trail/env params in generateLogMethod

**what changes**: signature expands from 2 params to 4 params

extant:
```ts
generateLogMethod({ level, minimalLogLevel })
```

proposed:
```ts
generateLogMethod({ level, minimalLogLevel, trail?, env? })
```

**could we do this differently?**

option A: extend signature (chosen)
option B: create generateLogMethodWithTrail
option C: create TrailInjector that wraps any log method

option B duplicates level filter, console selection, timestamp.
option C is overengineered — we only need this for one use case.
option A is minimal extension.

**verdict: correct** — minimal extension

---

## mechanism 3: trail/env in formatLogContentsForEnvironment

**what changes**: signature expands, output structure expands

extant:
```ts
formatLogContentsForEnvironment({ level, timestamp, message, metadata })
// returns { level, timestamp, message, metadata }
```

proposed:
```ts
formatLogContentsForEnvironment({ level, timestamp, message, metadata, trail?, env? })
// returns { level, timestamp, message, metadata, trail?, env? }
```

**could we do this differently?**

option A: extend signature (chosen)
option B: create formatLogContentsWithTrail
option C: compose output post-format

option B duplicates environment detection, JSON stringify logic.
option C would mean:
```ts
const base = formatLogContentsForEnvironment(...);
return { ...base, trail, env };
```
but this breaks for string output in AWS_LAMBDA — base is already JSON string.

option A is cleanest — format once with all fields.

**verdict: correct** — extend extant mechanism

---

## mechanism 4: LogTrail type shape

**what changes**: type structure

extant: `type LogTrail = string[]`
proposed: `type LogTrail = { exid: string | null; stack: string[] }`

**is there an extant pattern for "object with optional id and array"?**

other types in codebase...
- ContextLogTrail: `{ log: LogMethods & { trail?: LogTrail } }` — object shape
- LogMethods: `{ error, warn, info, debug }` — object shape

objects with named fields is the extant pattern for complex types.
string[] was used when trail was just a stack.

**verdict: correct** — consistent with extant type patterns

---

## mechanism 5: withLogTrail adaptation

**what changes**: trail access pattern

extant:
```ts
trail: [...(context.log.trail ?? []), name]
```

proposed:
```ts
trail: {
  exid: context.log.trail?.exid ?? null,
  stack: [...(context.log.trail?.stack ?? []), name]
}
```

**could we do this differently?**

option A: adapt in place (chosen)
option B: create withLogTrailV2

option B would duplicate all of withLogTrail (input/output log, duration, error handle).
option A adapts one line of trail access.

**verdict: correct** — adapt, not duplicate

---

## potential hidden duplications

### timestamp creation

extant: `new Date().toISOString()` in generateLogMethod
proposed: same

no duplication risk — timestamp stays in one place.

### console method selection

extant: `aIsEqualOrMoreImportantThanB` comparison in generateLogMethod
proposed: same

no duplication risk — logic stays in one place.

### environment detection

extant: `identifyEnvironment()` in formatLogContentsForEnvironment
proposed: same

no duplication risk — detection stays in one place.

---

## issues found

none. reviewed five mechanisms plus three potential duplication points. all use composition or extension, not duplication.

---

## summary

| mechanism | strategy | duplicates extant? |
|-----------|----------|-------------------|
| genContextLogTrail | compose genLogMethods | no |
| generateLogMethod + trail/env | extend params | no |
| formatLogContents + trail/env | extend params | no |
| LogTrail type shape | follow type patterns | no |
| withLogTrail adaptation | adapt in place | no |
| timestamp | unchanged | n/a |
| console selection | unchanged | n/a |
| env detection | unchanged | n/a |
