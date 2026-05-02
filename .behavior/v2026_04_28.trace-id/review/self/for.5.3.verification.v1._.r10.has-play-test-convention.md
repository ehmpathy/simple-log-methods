# review.self: has-play-test-convention (r10)

## review scope

tenth pass. question: are journey test files named correctly with `.play.test.ts` suffix?

## journey test check

### search for play tests

```sh
glob '**/*.play.test.ts'
```

**result**: no files found.

### search for all test files

```sh
glob 'src/**/*.test.ts'
```

**result**:
- src/domain.operations/generateLogMethod.test.ts
- src/domain.operations/formatLogContentsForEnvironment.test.ts
- src/domain.operations/genLogMethods.test.ts
- src/domain.operations/withLogTrail.test.ts
- src/domain.operations/genContextLogTrail.test.ts

all test files are unit tests (`.test.ts`). no integration tests. no journey tests.

## why no journey tests exist

this is a utility library with no external boundaries:

| test type | purpose | applicable? |
|-----------|---------|-------------|
| unit tests | test internal logic | yes |
| integration tests | test external boundaries | no — no db, no api |
| journey tests | test user workflows | no — sdk, not app |

the library:
- has no database
- has no external apis
- has no user interface
- has no cli commands

users consume this library via import. the "journey" is: import → call → receive output. this is covered by unit tests.

## verification

### check for misnamed journey tests

could any extant .test.ts files be journey tests that should be .play.test.ts?

| file | purpose | journey? |
|------|---------|----------|
| generateLogMethod.test.ts | test log method generation | no — unit |
| formatLogContentsForEnvironment.test.ts | test output format | no — unit |
| genLogMethods.test.ts | test log methods object | no — unit |
| withLogTrail.test.ts | test wrapper behavior | no — unit |
| genContextLogTrail.test.ts | test context creation | no — unit |

none of these are journey tests. all test internal behavior in isolation.

### check if play convention is supported

searched for jest config patterns:

```sh
grep -r "play" jest.*.config.ts
```

no mention of .play. in jest configs. this repo does not use the play test convention.

## deeper analysis: what would a journey test look like?

if this library had user journeys, they might look like:

### hypothetical journey: "developer debugs production issue"

```ts
// genContextLogTrail.play.test.ts (hypothetical)
given('a developer needs to correlate logs from a request', () => {
  when('they create context and emit logs across procedures', () => {
    then('all logs share the same trail.exid', () => {
      // ... setup, calls, assertions
    });
  });
});
```

but this is exactly what genContextLogTrail.test.ts case1 tests — the only difference is the file name convention.

### why unit tests are sufficient

for utility libraries, the "journey" is:

```
1. developer imports genContextLogTrail
2. developer calls genContextLogTrail({ trail, env })
3. developer uses context.log.info()
4. logs contain trail.exid
```

each step is a function call. no external state. no async workflows. no multi-service coordination.

the unit tests in genContextLogTrail.test.ts exercise this exact journey:
- case1 t0: create context with log methods (step 2)
- case1 t1: emit log with trail.exid (steps 3-4)

### comparison to libraries that need play tests

| library type | has external state? | needs play tests? |
|--------------|---------------------|-------------------|
| database sdk | yes (db connection) | yes |
| api client | yes (network) | yes |
| cli tool | yes (filesystem, stdout) | yes |
| utility library | no | no |

simple-log-methods has no external state. console.log is mocked in tests. pure function calls.

## why it holds

1. **no journey tests exist** — utility library has no user journeys to test
2. **all tests are unit tests** — test internal logic, not workflows
3. **unit tests cover the "journey"** — import → call → output is tested
4. **convention not applicable** — sdk libraries without external state don't need play tests
5. **no misnamed files** — all .test.ts files have correct names
6. **hypothetical analysis** — even if we added play tests, they'd duplicate unit tests

## summary

no .play.test.ts files exist. this is a utility library — journey tests are not applicable. all tests are unit tests that verify internal behavior. the "journey" (import → call → output) is covered by unit tests.

**why it holds**: searched for play tests, found none. analyzed what play tests would look like for this library — they'd be identical to unit tests. utility libraries without external state don't need journey tests. all .test.ts files have correct names.
