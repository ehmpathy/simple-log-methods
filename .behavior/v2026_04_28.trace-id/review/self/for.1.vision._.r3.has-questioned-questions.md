# self-review: has-questioned-questions

triage of open questions in 1.vision.md.

---

## triage of questions

### question 1: is `genContextLogTrail` the right name?

**can answer via logic now?** no. name choice is subjective.

**can answer via extant docs/code?** no.

**should research?** no. not a factual question.

**does only wisher know?** yes. this is their preference.

**verdict: [wisher]**

### question 2: should traceId be required or optional?

**can answer via logic now?** partially. optional with auto-gen fallback is more forgivable.

**can answer via extant docs/code?** no.

**should research?** no.

**does only wisher know?** yes. this affects strictness of the api.

**verdict: [wisher]**

### question 3: commit field — always include or only when provided?

**can answer via logic now?** yes.

if commit is undefined, should we:
- include `commit: undefined` in logs? no — adds noise
- include `commit: null` in logs? no — adds noise
- omit commit field entirely? yes — cleaner logs

**answer:** only include when provided. omit when undefined.

**verdict: [answered]**

### question 4: should this replace generateLogMethods entirely?

**can answer via logic now?** no. semver implications.

**can answer via extant docs/code?** no.

**should research?** no.

**does only wisher know?** yes. this is a semver/api strategy decision.

**verdict: [wisher]**

### question 5: tracer vs traceId field name?

**can answer via logic now?** partially. traceId aligns with opentelemetry.

**can answer via extant docs/code?** no. wish uses both terms.

**should research?** no.

**does only wisher know?** yes. this is their preference.

**verdict: [wisher]**

### question 6: ContextLog type name?

**can answer via logic now?** no. name choice is subjective.

**can answer via extant docs/code?** partially. extant type is ContextLogTrail.

**should research?** no.

**does only wisher know?** yes. this affects all downstream code.

**verdict: [wisher]**

### question 7: graceful vs strict mode?

**can answer via logic now?** no. this is a design philosophy decision.

**can answer via extant docs/code?** no.

**should research?** no.

**does only wisher know?** yes. this affects how strict the api is.

**verdict: [wisher]**

### question 8: withLogTrail compatibility?

**can answer via logic now?** yes.

if genContextLogTrail returns log methods that inject traceId into metadata on every call, then withLogTrail doesn't need to know about traceId. the wrapped methods will still inject it.

**answer:** genContextLogTrail is solely responsible. withLogTrail wraps whatever log methods it receives; if those methods inject traceId, the wrap preserves that behavior.

**verdict: [answered]**

### research 1: aws lambda request id

**can answer via logic now?** no. factual question.

**can answer via extant docs/code?** no.

**should research?** yes. AWS docs will confirm.

**does only wisher know?** no.

**verdict: [research]**

### research 2: cloudwatch insights syntax

**can answer via logic now?** no. factual question.

**can answer via extant docs/code?** no.

**should research?** yes. AWS docs will confirm.

**does only wisher know?** no.

**verdict: [research]**

---

## summary

| question | verdict |
|----------|---------|
| genContextLogTrail name | [wisher] |
| traceId required/optional | [wisher] |
| commit field | [answered] — only when provided |
| replace generateLogMethods | [wisher] |
| tracer vs traceId | [wisher] |
| ContextLog type name | [wisher] |
| graceful vs strict | [wisher] |
| withLogTrail compatibility | [answered] — genContextLogTrail responsible |
| aws lambda request id | [research] |
| cloudwatch insights syntax | [research] |

---

## questions answered now

### Q3: commit field

**resolution:** only include commit in log output when provided. omit field when undefined.

**why:** clean logs without noise. undefined/null fields add no value.

**action:** update vision to clarify this.

### Q8: withLogTrail compatibility

**resolution:** genContextLogTrail returns log methods that inject traceId into every call's metadata. withLogTrail wraps those methods transparently; it doesn't need special treatment.

**why:** separation of concerns. genContextLogTrail owns traceId. withLogTrail owns trail.

**action:** update vision to clarify this.

---

## why each deferred question cannot be answered now

### [wisher] Q1: genContextLogTrail name

**why i cannot decide:** the name must balance:
- clarity (what does it do?)
- brevity (short enough to type often)
- consistency (does it match extant name patterns?)

alternatives i considered:
- `genContextLogTrail` — follows `gen*` verb pattern; says "context log" directly
- `createContextLog` — more explicit but longer
- `withTracer` — emphasizes tracer but hides "log" aspect
- `genLogContext` — inverts noun order

i lean toward `genContextLogTrail` but the wisher may have preferences based on patterns in other ehmpathy repos i haven't seen. only they know the full ecosystem name conventions.

### [wisher] Q2: traceId required vs optional

**why i cannot decide:** this is a strictness/ergonomics tradeoff:
- **required**: forces explicit traceId at every entry point. catches mistakes. but hostile to quick prototypes or local dev.
- **optional with auto-gen**: more forgivable. uuid fallback ensures logs always correlate. but hides when caller forgot to thread a meaningful id.

i lean toward optional with auto-gen (graceful), but the wisher may prefer strict enforcement based on their observability standards. only they know how their teams use logs in practice.

### [wisher] Q4: replace generateLogMethods entirely?

**why i cannot decide:** semver implications:
- **coexist**: backwards compat, no break change. but two ways to create logs = confusion.
- **replace**: cleaner api, one way to do it. but break change, requires major version bump.

i lean toward coexist (deprecate in docs, not code), but the wisher may prefer a clean break if they're already planned a major release. only they know the semver roadmap.

### [wisher] Q5: tracer vs traceId field name

**why i cannot decide:** the wish uses both terms:
- "thread through a traceid" — suggests `traceId`
- "tracer must become a toplevel standard" — suggests `tracer`

industry alignment says `traceId` (opentelemetry uses this). but the wisher may have domain-specific reasons for `tracer`. only they can clarify intent.

### [wisher] Q6: ContextLog type name

**why i cannot decide:** extant type is `ContextLogTrail` which includes `trail`. if we add traceId:
- reuse `ContextLogTrail` and add traceId to it?
- create new `ContextLog` without trail?
- create `ContextLogTraced` that extends base?

the name affects all downstream code. only the wisher knows how other repos reference these types and what rename cascades would cost.

### [wisher] Q7: graceful vs strict mode

**why i cannot decide:** this is philosophy:
- **graceful**: logs work even if caller misses genContextLogTrail. traceId absent but no crash.
- **strict**: throw error if traceId absent. forces discipline but hostile to gradual adoption.

i lean graceful (pit of success over pit of failure), but the wisher may prefer strict if their teams have been burned by uncorrelated logs before. only they know the org's pain points.

### [research] R1: aws lambda request id

**why i cannot answer now:** the vision claims `event.requestContext.requestId` is available in lambda handlers. i believe this is true but have not verified against current AWS docs.

**what could go wrong:**
- path might be slightly different (e.g., `event.requestContext.awsRequestId`)
- might not be available in all event types (sqs, sns, etc.)
- format might have constraints i don't know

**action needed:** fetch AWS Lambda docs to confirm exact path and availability.

### [research] R2: cloudwatch insights syntax

**why i cannot answer now:** the vision claims filter by `traceId` in cloudwatch insights is trivial. i believe this is true but have not verified the exact query syntax.

**what could go wrong:**
- field might need to be in specific format for index
- nested fields might require different query syntax
- json parse might have constraints

**action needed:** fetch CloudWatch Insights docs to confirm query syntax for custom json fields.

---

## what i learned

1. **triage questions early** — some questions can be answered immediately via logic. don't defer all to the wisher.

2. **factual questions need research** — aws-specific questions need verification, not guesses.

3. **wisher questions are design decisions** — name choice, strictness, api strategy — these are subjective and need wisher input.

4. **articulate the tradeoffs** — for each deferred question, explain what i considered and why i cannot decide alone. this helps the wisher make informed decisions.
