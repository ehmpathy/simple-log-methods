# review.self: has-consistent-mechanisms

## review scope

reviewed new mechanisms for duplication of extant functionality.

## mechanisms analysis

### 1. genContextLogTrail vs genLogMethods

**observation**: both functions create log methods via generateLogMethod.

**genLogMethods** (lines 41-53):
```ts
return {
  error: generateLogMethod({ level: LogLevel.ERROR, minimalLogLevel }),
  warn: generateLogMethod({ level: LogLevel.WARN, minimalLogLevel }),
  info: generateLogMethod({ level: LogLevel.INFO, minimalLogLevel }),
  debug: generateLogMethod({ level: LogLevel.DEBUG, minimalLogLevel }),
};
```

**genContextLogTrail** (lines 51-76):
```ts
return {
  error: generateLogMethod({ level: LogLevel.ERROR, minimalLogLevel, trail, env }),
  // ... same pattern with trail/env
};
```

**is this duplication?**

considered alternative: refactor genLogMethods to accept optional trail/env and reuse it in genContextLogTrail.

**why current design holds**:
1. genLogMethods is for internal/bare logs (no trail)
2. genContextLogTrail is for application entry points (with trail)
3. the blueprint prescribes them as separate functions with different purposes
4. a merge would complicate genLogMethods API for a use case it wasn't designed for
5. the "duplication" is 4 similar lines — minimal overhead

**verdict**: holds. intentional separation, not unnecessary duplication.

### 2. generateLogMethod already supports trail/env

**observation**: generateLogMethod now accepts trail/env params.

**verified**: both genLogMethods and genContextLogTrail use generateLogMethod.
- genLogMethods: calls without trail/env (bare logs)
- genContextLogTrail: calls with trail/env (traceable logs)

**verdict**: holds. reuses extant generateLogMethod. no new mechanism created.

### 3. formatLogContentsForEnvironment reuse

**observation**: trail/env format is done in formatLogContentsForEnvironment.

**verified**: no new format function was created. the extant function was extended.

**verdict**: holds. reuses and extends extant mechanism.

### 4. withLogTrail stack logic

**observation**: withLogTrail already handles stack append.

**verified**: genContextLogTrail does NOT duplicate stack append logic. it only sets initial trail state. withLogTrail handles the stack growth.

**verdict**: holds. clear separation of responsibilities.

## conclusion

no unauthorized duplication. all new code either:
1. reuses extant mechanisms (generateLogMethod, formatLogContentsForEnvironment)
2. extends extant mechanisms with new params
3. or serves a distinct purpose (genContextLogTrail vs genLogMethods)
