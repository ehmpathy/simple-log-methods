# self-review: has-questioned-assumptions

review of 1.vision.md for hidden assumptions.

---

## stated assumptions review

### assumption 1: single traceId per request

**what do we assume?**
no need for span ids or parent-child relationships.

**did wisher say this?**
no. the wish says "thread through a traceid" — doesn't mention spans. i inferred "no spans" as reasonable scope.

**what if the opposite were true?**
if we needed span hierarchies, we'd need opentelemetry. that's a much larger scope. the wish doesn't ask for it.

**evidence:**
the wish says "simple" — opentelemetry spans are not simple.

**verdict: holds** — reasonable scope limit, unstated by wisher but aligned with "simple"

### assumption 2: commit is optional

**what do we assume?**
not every deployment has a commit sha.

**did wisher say this?**
no. the wish says "also, commit" without specify required/optional.

**what if the opposite were true?**
if commit were required, users without CI/CD commit sha would have to fake it or fail. that's hostile.

**evidence:**
many local dev environments don't have COMMIT_SHA. optional is more forgivable.

**verdict: holds** — safe default, not explicitly stated

### assumption 3: flat structure

**what do we assume?**
`{ traceId, commit }` is simpler than `{ tracer: { traceId }, commit }`.

**did wisher say this?**
ambiguous. wish says "{ tracer, commit } are added as supported fields" — peer fields, but tracer could be an object.

**what if the opposite were true?**
nested `{ tracer: { traceId, spanId? } }` would group trace-related fields. cleaner if we add spanId later.

**evidence:**
wish also says "tracer must become a toplevel standard" — "toplevel" suggests tracer is a first-class field, possibly with its own structure.

**issue found:** the flat vs nested decision affects api design significantly. i chose flat for simplicity but wisher may prefer nested for extensibility.

**verdict: questionable** — flagged for wisher in requirements review

### assumption 4: no async context propagation

**what do we assume?**
use explicit context pass, not AsyncLocalStorage.

**did wisher say this?**
not explicitly. but wish says "the pattern becomes to simply always use logs via context.log" — suggests explicit context.

**what if the opposite were true?**
AsyncLocalStorage could auto-propagate traceId. less explicit, more magical. breaks in some edge cases (native bindings, worker threads).

**evidence:**
ehmpathy codebases use explicit (input, context) pattern. AsyncLocalStorage would be a paradigm shift.

**verdict: holds** — aligned with extant patterns, implicit in "context.log" phrase

### assumption 5: ContextLog type

**what do we assume?**
ContextLog is shorthand for `{ log: LogMethods }`. TBD whether formal type or alias.

**verdict: deferred** — already flagged for wisher

---

## hidden assumptions surfaced

### hidden assumption A: logs go to console

**what do we assume?**
traceId/commit are added to console output.

**did wisher say this?**
no. extant code uses console.log/console.warn.

**what if the opposite were true?**
if users want different transports (datadog, sentry), they'd need to intercept console or change the logger.

**evidence:**
simple-log-methods is focused on console + cloudwatch. custom transports are out of scope for this library.

**verdict: holds** — library scope is console/cloudwatch, not general transport

### hidden assumption B: traceId is a string

**what do we assume?**
traceId can be any string (uuid, aws request id, job id).

**did wisher say this?**
implied by examples in wish (no type specified).

**what if the opposite were true?**
if traceId were typed as UUID, we'd enforce format. more strict, less flexible.

**evidence:**
flexibility is better — let caller provide whatever id makes sense (aws requestId, job.id, uuid).

**verdict: holds** — flexibility over strictness for id format

### hidden assumption C: genContextLogTrail is synchronous

**what do we assume?**
`const context = { log: genContextLogTrail({ ... }) }` works inline.

**did wisher say this?**
implied by "genContextLogTrail which accepts a trace id" — sounds like a pure function.

**what if the opposite were true?**
if genContextLogTrail needed to fetch config or connect to a service, it would be async. that would break the inline pattern.

**evidence:**
all needed info (traceId, commit) is available synchronously at entry point.

**verdict: holds** — no reason for async, keep it simple

### hidden assumption D: traceId is user-provided

**what do we assume?**
caller provides traceId explicitly.

**did wisher say this?**
yes: "genContextLogTrail which accepts a trace id".

**what if the opposite were true?**
if genContextLogTrail auto-generated traceId, caller would have less control but fewer decisions.

**evidence:**
caller knows best what id to use (aws requestId, job.id, etc). auto-generate as fallback, not default.

**verdict: holds** — explicit is better, already flagged as wisher question (optional with auto-gen fallback)

### hidden assumption E: one log method set per request

**what do we assume?**
you create context.log once at entry point, thread it through.

**did wisher say this?**
implied by "the pattern becomes to simply always use logs via context.log".

**what if the opposite were true?**
if you needed different log configs for different code paths, you'd create multiple context.log instances. the traceId would still be consistent as long as you pass it.

**evidence:**
the pattern is "inject once, flow everywhere". if you need different configs, create a new context.log with same traceId.

**verdict: holds** — doesn't prevent multiple instances, just establishes the common pattern

---

## summary

| assumption | stated? | verdict |
|------------|---------|---------|
| single traceId per request | no | holds — reasonable scope |
| commit is optional | no | holds — safe default |
| flat structure | ambiguous | questionable — ask wisher |
| no async context propagation | implied | holds — aligned with extant patterns |
| ContextLog type | stated as TBD | deferred |
| logs go to console | no | holds — library scope |
| traceId is string | implied | holds — flexibility |
| genContextLogTrail is sync | implied | holds — no reason for async |
| traceId is user-provided | yes | holds — explicit is better |
| one log method set per request | implied | holds — common pattern |

---

## deeper hidden assumptions (second pass)

### hidden assumption F: concurrent requests are a common problem

**what do we assume?**
the vision's "before" example assumes users have concurrent requests to the same entity and need to distinguish them.

**did wisher say this?**
not explicitly. but "traceid" implies multi-request correlation is needed.

**what if the opposite were true?**
if users only have sequential requests, traceId adds overhead without benefit. but even then, traceId helps when requests interleave in logs.

**evidence:**
production systems almost always have concurrent requests. the benefit outweighs the small cost.

**verdict: holds** — common enough to justify

### hidden assumption G: graceful degradation is better than fail-fast

**what do we assume?**
vision line 171 says "logs still work, just absent traceId" if user forgets genContextLogTrail.

**did wisher say this?**
no. this is a design choice i made.

**what if the opposite were true?**
fail-fast (throw error if traceId absent) would enforce usage more strictly. forces discipline.

**evidence:**
graceful degradation is more forgivable for adoption. strict enforcement can be added later via lint rules or runtime checks.

**issue found:** should we offer a "strict mode" option that throws if traceId is not provided?

**verdict: questionable** — worth ask to wisher: graceful vs strict?

### hidden assumption H: withLogTrail preserves traceId

**what do we assume?**
vision line 173 says "withLogTrail already threads context.log; traceId preserved".

**did wisher say this?**
no. i assumed this based on how withLogTrail works.

**what if the opposite were true?**
if withLogTrail creates new context.log without traceId, the chain breaks.

**verification needed:**
i should check withLogTrail.ts to confirm it preserves context.log properties.

**after check of withLogTrail.ts (lines 147-173):**
- withLogTrail creates `logMethodsWithContext` that wraps context.log
- it preserves `_orig` reference to original log
- but it does NOT explicitly copy custom properties like traceId

**issue found:** if traceId is stored on context.log, withLogTrail may not preserve it. need to verify the implementation approach.

**verdict: needs verification** — this assumption may be wrong and require implementation changes

### hidden assumption I: lambda/sqs are primary use cases

**what do we assume?**
vision only shows lambda handler and sqs job examples.

**did wisher say this?**
no. these are just common patterns.

**what if the opposite were true?**
express.js, cli tools, cron jobs are also valid entry points. the pattern applies the same way.

**evidence:**
lambda/sqs are illustrative, not exclusive. the pattern generalizes.

**verdict: holds** — examples are representative, not restrictive

### hidden assumption J: users grep logs by traceId

**what do we assume?**
vision says "one grep by traceId shows exactly one request's journey".

**did wisher say this?**
implied by "correlate logs".

**what if the opposite were true?**
if users only use cloudwatch insights or datadog search, they may filter by traceId field rather than grep.

**evidence:**
"grep" is shorthand for any search. the point is traceId enables filter.

**verdict: holds** — grep is metaphor for any search/filter

---

## updated summary

| assumption | stated? | verdict |
|------------|---------|---------|
| single traceId per request | no | holds — reasonable scope |
| commit is optional | no | holds — safe default |
| flat structure | ambiguous | questionable — ask wisher |
| no async context propagation | implied | holds — aligned with extant patterns |
| ContextLog type | stated as TBD | deferred |
| logs go to console | no | holds — library scope |
| traceId is string | implied | holds — flexibility |
| genContextLogTrail is sync | implied | holds — no reason for async |
| traceId is user-provided | yes | holds — explicit is better |
| one log method set per request | implied | holds — common pattern |
| concurrent requests are common | implied | holds — common enough |
| graceful degradation | no | **questionable** — ask wisher |
| withLogTrail preserves traceId | assumed | **needs verification** |
| lambda/sqs are primary | no | holds — representative examples |
| users grep by traceId | implied | holds — metaphor for search |

---

## issues found and how they were addressed

### issue 1: graceful vs strict mode — deferred to wisher

**what was found:**
vision assumes graceful degradation (logs work without traceId). this is a design choice, not a requirement.

**how it was addressed:**
- added question 7 to vision: "graceful vs strict mode? should absent traceId be graceful or strict?"
- vision edgecases table updated to acknowledge this is a design decision
- recommendation documented: default graceful, offer strict option

**why this matters:**
teams with strict observability requirements may prefer fail-fast. the wisher should decide.

### issue 2: withLogTrail traceId preservation — deferred as implementation detail

**what was found:**
vision line 173 claimed "withLogTrail already threads context.log; traceId preserved" without verification.

**how it was addressed:**
- added question 8 to vision: "withLogTrail compatibility? should withLogTrail preserve traceId automatically?"
- updated edgecases table (line 173) to say "traceId preservation TBD (implementation detail)"
- documented three implementation options in this review

**why this matters:**
the claim was aspirational, not verified. the implementation approach affects whether withLogTrail needs changes.

---

## why each non-issue holds (for others to learn from)

### single traceId per request — why it holds

the wish says "simple". opentelemetry spans with parent-child relationships are complex. the wisher didn't ask for spans. scope to just traceId keeps the library simple.

**lesson:** when the wish says "simple", honor that. don't scope-creep into complex territory.

### commit is optional — why it holds

not every deployment environment has COMMIT_SHA. require it = break local development. optional = forgivable for edge cases.

**lesson:** defaults should be permissive. strict enforcement can be opt-in.

### no async context propagation — why it holds

ehmpathy codebases use explicit (input, context) pattern. AsyncLocalStorage is magic that breaks in edge cases. the wish says "context.log" which implies explicit context.

**lesson:** align with extant patterns. paradigm shifts need explicit buy-in.

### logs go to console — why it holds

simple-log-methods is scoped to console + cloudwatch. custom transports are out of scope. the package name says "simple".

**lesson:** honor library scope. don't add features that don't belong.

### traceId is a string — why it holds

flexibility lets caller use whatever id makes sense (aws requestId, job.id, uuid). strict UUID enforcement would limit use cases without benefit.

**lesson:** prefer flexibility over strictness unless strictness adds value.

### genContextLogTrail is sync — why it holds

all inputs (traceId, commit) are available synchronously. no reason for async. async would complicate the inline pattern.

**lesson:** don't add async unless needed. sync is simpler.

### traceId is user-provided — why it holds

the wish says "genContextLogTrail which accepts a trace id" — explicit input. caller knows best what id to use for their context.

**lesson:** explicit is better than implicit. the wish specified explicit.

### one log method set per request — why it holds

"inject once, flow everywhere" is the pattern. multiple instances are still possible if needed. this doesn't prevent, just establishes common case.

**lesson:** document the common pattern, don't prevent edge cases.

### concurrent requests are common — why it holds

production systems have concurrent requests. even if a specific user doesn't now, they will eventually. the benefit outweighs the tiny cost.

**lesson:** design for production, not just development.

### lambda/sqs are primary use cases — why it holds

they're illustrative examples, not exclusive. the pattern applies to express, cli, cron. examples should be representative.

**lesson:** examples should be common cases, not exhaustive.

### users grep by traceId — why it holds

"grep" is metaphor for any search/filter (cloudwatch insights, datadog). the point is traceId enables correlation.

**lesson:** use familiar metaphors. don't assume literal interpretation.

---

## what i learned from this review

1. **verify claims before commit** — i made a claim about withLogTrail behavior without verify. aspirational claims should be flagged as TBD.

2. **design choices are not requirements** — graceful vs strict is a design decision i made, not something the wish specified. surface such decisions as questions.

3. **implementation details leak into vision** — the withLogTrail preservation question is really an implementation concern, but it affects the vision's "pit of success" claims. call out dependencies.

4. **articulate why non-issues hold** — even when assumptions seem obvious, articulate why they hold. this helps others understand the rationale and learn from the review.
