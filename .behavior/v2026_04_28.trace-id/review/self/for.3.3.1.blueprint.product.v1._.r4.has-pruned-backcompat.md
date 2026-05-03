# self-review: has-pruned-backcompat (r4)

fourth pass review of 3.3.1.blueprint.product.v1.i1.md for backwards compatibility concerns.

different angle: what if a downstream consumer upgrades? what breaks?

---

## scenario A: consumer uses generateLogMethods

**before upgrade:**
```ts
import { generateLogMethods } from 'simple-log-methods';
const log = generateLogMethods();
log.info('hello');
```

**after upgrade:**
```ts
// compile error: generateLogMethods is not exported
```

**was backcompat requested?**
no — wisher said "zero backcompat"

**is this break documented?**
blueprint says `[-] export { generateLogMethods }`. yes, documented.

**verdict: correct** — clean break, as requested

---

## scenario B: consumer uses context.log.trail as string[]

**before upgrade:**
```ts
const log = await someProc(input, context);
const trailLength = context.log.trail.length; // works: trail is string[]
const lastItem = context.log.trail[0]; // works: string
```

**after upgrade:**
```ts
const trailLength = context.log.trail.length; // error: trail is { exid, stack }
const lastItem = context.log.trail[0]; // error: no index signature
```

**was backcompat requested?**
no

**how common is this pattern?**
extant code check... withLogTrail accesses `context.log.trail` but will be updated.
external consumers? unlikely to access `.trail` directly — it's an implementation detail.

**should we add migration path?**
no — "zero backcompat" applies. consumers should access `.trail.stack` or `.trail.exid`.

**verdict: correct** — type change is acceptable

---

## scenario C: consumer parses log output

**before upgrade:**
```json
{ "level": "info", "timestamp": "...", "message": "hello", "metadata": {} }
```

**after upgrade:**
```json
{ "level": "info", "timestamp": "...", "message": "hello", "metadata": {}, "trail": { "stack": [] } }
```

**was backcompat requested?**
no

**is this a concern?**
consumers who parse logs with strict schema validation may error on unknown fields.
but: log output has never been a stable API. add fields is expected in log libraries.

**should we document this?**
yes — release notes should mention new fields in output.

**verdict: correct** — additive change is acceptable; document in release notes

---

## scenario D: consumer imports ContextLogTrail type

**before upgrade:**
```ts
import { ContextLogTrail } from 'simple-log-methods';
const ctx: ContextLogTrail = { log: myLog };
```

**after upgrade:**
```ts
// type error if myLog.trail is string[] instead of { exid, stack }
```

**was backcompat requested?**
no

**how common is this pattern?**
ContextLogTrail is typically used as type annotation, not constructed manually.
most consumers receive context from withLogTrail or genContextLogTrail.

**verdict: correct** — type flows through; manual construction is rare

---

## scenario E: consumer subclasses or extends LogMethods

**before upgrade:**
```ts
import { LogMethods } from 'simple-log-methods';
class MyLogger implements LogMethods { ... }
```

**after upgrade:**
```ts
// no change to LogMethods interface
// implementation still valid
```

**was backcompat requested?**
not explicitly, but LogMethods is public interface

**is this a concern?**
no — LogMethods interface is unchanged. debug, info, warn, error signatures remain.

**verdict: correct** — no break

---

## open questions for wisher

none. the wisher explicitly said "zero backcompat" which means:
1. no deprecation warnings
2. no re-export aliases
3. no migration period
4. clean breaks are acceptable

the blueprint correctly implements this directive.

---

## release notes recommendation

while not part of backcompat code, release notes should document:
1. `generateLogMethods` removed → use `genLogMethods`
2. `LogTrail` type changed from `string[]` to `{ exid, stack }`
3. log output now includes `trail` and optionally `env` fields

this is documentation, not backcompat code.

---

## issues found

none. blueprint correctly implements zero backcompat.

---

## summary

| scenario | breaks? | backcompat requested? | verdict |
|----------|---------|----------------------|---------|
| generateLogMethods import | yes | no (zero backcompat) | correct |
| trail as string[] | yes | no | correct |
| log output parse | maybe | no | correct (additive) |
| ContextLogTrail type | yes | no | correct |
| LogMethods interface | no | implicit | correct |
