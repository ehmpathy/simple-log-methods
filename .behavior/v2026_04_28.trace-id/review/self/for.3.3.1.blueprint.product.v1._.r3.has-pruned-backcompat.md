# self-review: has-pruned-backcompat (r3)

review of 3.3.1.blueprint.product.v1.i1.md for backwards compatibility concerns.

---

## backcompat concern 1: generateLogMethods rename

**what does the blueprint say?**
- `[-] export { generateLogMethods }` (remove)
- `[+] export { genLogMethods }` (add)

**was backcompat explicitly requested?**
no — wisher explicitly said "zero backcompat"

**evidence:**
conversation transcript shows:
- wisher: "genLogMethods, cutover to that name"
- wisher: "zero backcompat"

**verdict: correct** — no backcompat, as wisher requested

---

## backcompat concern 2: LogTrail type change

**what does the blueprint say?**
- before: `LogTrail = string[]`
- after: `LogTrail = { exid: string | null; stack: string[] }`

**was backcompat explicitly requested?**
no — no mention of maintain old shape

**is this a break?**
yes — any code that treats `context.log.trail` as `string[]` will break.

**should we add backcompat?**
no — this is internal library change. the library's purpose is to provide log methods, not to expose trail as a stable API. callers who accessed trail directly were depend on implementation detail.

**verdict: correct** — type change is acceptable break

---

## backcompat concern 3: withLogTrail behavior

**what does the blueprint say?**
- `[○] retain` — withLogTrail continues to work
- `[~] trail structure access` — adapt to new `{ exid, stack }` shape

**was backcompat explicitly requested?**
not explicitly, but withLogTrail is part of the public API.

**is this a break?**
no — withLogTrail's public contract is unchanged:
- still wraps procedures
- still logs input/output/error
- still appends to trail stack

the internal adaptation to new trail shape is invisible to callers.

**verdict: correct** — public contract preserved, internal adaptation is fine

---

## backcompat concern 4: log output structure

**what does the blueprint say?**
log output gains new fields: `trail: { exid?, stack }` and `env?: { commit }`

**was backcompat explicitly requested?**
no — log output structure is not a stable API

**is this a break?**
depends on perspective:
- consumers that parse logs may need to update queries
- but log format has never been promised as stable

**should we add backcompat?**
no — add fields is additive, not destructive. extant fields (`level`, `timestamp`, `message`, `metadata`) are preserved.

**verdict: correct** — additive change to output is acceptable

---

## backcompat concern 5: ContextLogTrail type

**what does the blueprint say?**
- `[○] ContextLogTrail interface` — log.trail now typed as LogTrail (with exid)

**was backcompat explicitly requested?**
no

**is this a break?**
no — ContextLogTrail is a library-provided type. callers import it, they don't implement it. type change flows through naturally when they update the library.

**verdict: correct** — type flows through library update

---

## hidden backcompat not in blueprint

**are there any backcompat shims, deprecation warnings, or transition utils?**

review of blueprint:
- no deprecation warning for generateLogMethods
- no re-export alias
- no console.warn on old import path

**was any backcompat mechanism requested?**
no — "zero backcompat" means no transition period

**verdict: correct** — no hidden backcompat mechanisms

---

## issues found

none. the blueprint correctly implements "zero backcompat" as wisher requested.

---

## summary

| concern | wisher requested backcompat? | blueprint handles correctly? |
|---------|------------------------------|------------------------------|
| generateLogMethods rename | no ("zero backcompat") | yes (hard removal) |
| LogTrail type change | no | yes (clean break) |
| withLogTrail behavior | implicit (public API) | yes (public contract preserved) |
| log output structure | no | yes (additive change) |
| ContextLogTrail type | no | yes (type flows through) |
| deprecation warnings | no ("zero backcompat") | yes (none added) |
