# review.self: has-journey-tests-from-repros (r5)

## review scope

fifth pass. question: even without a repros artifact, did I cover all user journeys from the vision?

## complete inventory of vision journeys

### journey 1: lambda handler (lines 100-122)

**pattern**: entry point creates context with trail.exid from request id

```ts
const context = genContextLogTrail({
  trail: { exid: event.requestContext.requestId },
  env: { commit: process.env.COMMIT_SHA },
});
context.log.info('request received', { path: event.path });
```

**test coverage**:
- genContextLogTrail.test.ts case1 t0: creates context with log methods
- genContextLogTrail.test.ts case1 t1: output includes trail.exid and env.commit

### journey 2: background job (lines 124-138)

**pattern**: job handler creates context with job.id as exid

```ts
const context = genContextLogTrail({
  trail: { exid: job.id },
  env: { commit: process.env.COMMIT_SHA },
});
```

**test coverage**: same as journey 1. different exid source, same genContextLogTrail behavior.

### journey 3: multi-service trail (lines 140-207)

**pattern**: service A passes trail to service B via payload

```ts
// service A
const trailState = context.log.trail;
// pass trailState to service B

// service B
const context = genContextLogTrail({
  trail: { exid: event.trail?.exid ?? null, stack: event.trail?.stack ?? [] },
  ...
});
```

**test coverage**:
- genContextLogTrail.test.ts case1 t0: "context.log.trail returns current trail state"
- genContextLogTrail.test.ts case1: stack is initialized from input

**question**: is stack inheritance tested?

let me check. the test passes `stack: ['outer']` and verifies `context.log.trail` returns `{ exid: 'req_abc', stack: ['outer'] }`.

**verification**: yes, stack inheritance is tested in case1 t0.

### journey 4: SQS message (lines 212-243)

**pattern**: producer sends trail in messageAttributes, consumer parses and uses

```ts
// consumer
const context = genContextLogTrail({
  trail: { exid: exidFromCaller, stack: stackFromCaller },
  env: { commit: process.env.COMMIT_SHA },
});
```

**test coverage**: same as journey 3. different transport, same genContextLogTrail behavior.

### journey 5: direct lambda invoke (lines 245+)

**pattern**: caller passes trail in payload, callee uses

**test coverage**: same as journey 3. different transport, same genContextLogTrail behavior.

### journey 6: trail.exid unknown (usecase 1 in blackbox)

**pattern**: when exid is unknown, pass null

```ts
genContextLogTrail({ trail: { exid: null, stack: [] }, env: {...} });
```

**test coverage**: genContextLogTrail.test.ts case3 - output omits exid but includes stack

### journey 7: env.commit unavailable (usecase 1 in blackbox)

**pattern**: when commit is unavailable, pass null

```ts
genContextLogTrail({ trail: {...}, env: { commit: null } });
```

**test coverage**: genContextLogTrail.test.ts case5 - output omits env object

### journey 8: all log levels (usecase 6 in blackbox)

**pattern**: debug/info/warn/error all include trail

**test coverage**: genContextLogTrail.test.ts case6 - all log levels tested

## key insight

the vision describes **usage patterns**, not unique behaviors. journeys 1-5 all exercise the same genContextLogTrail behavior with different exid sources/transports. the tests cover the **behavior**, not the **source**.

this is correct. the library does not know about lambda, SQS, or direct invoke. it only knows about:
1. create context with trail/env
2. emit logs with trail/env
3. expose trail state for serialization

## summary

| journey | behavior tested | test location |
|---------|-----------------|---------------|
| lambda handler | create context, emit trail | case1 |
| background job | create context, emit trail | case1 |
| multi-service | trail state access, stack inherit | case1 t0 |
| SQS message | create context with stack | case1 |
| direct invoke | create context with stack | case1 |
| exid unknown | omit exid from output | case3 |
| commit unavailable | omit env from output | case5 |
| all log levels | trail included | case6 |

all journeys map to tested behaviors. BDD structure verified in genContextLogTrail.test.ts.

**why it holds**: the library tests behaviors, not transports. all user journey behaviors have coverage.
