# review.self: has-consistent-conventions (r4)

## review scope

deeper review. read actual code files line by line. compared import patterns, JSDoc styles, and code structure.

## files examined

1. genContextLogTrail.ts (new code)
2. genLogMethods.ts (extant reference)
3. withLogTrail.ts (extant reference)

## convention comparison

### 1. import patterns

**genLogMethods.ts**:
```ts
import { LogLevel } from '@src/domain.objects/constants';
import { generateLogMethod, type LogMethod } from './generateLogMethod';
import { getRecommendedMinimalLogLevelForEnvironment } from './getRecommendedMinimalLogLevelForEnvironment';
```

**genContextLogTrail.ts**:
```ts
import { LogLevel } from '@src/domain.objects/constants';
import type { ContextLogTrail, LogTrail } from '@src/domain.objects/LogTrail';
import { generateLogMethod } from './generateLogMethod';
import { getRecommendedMinimalLogLevelForEnvironment } from './getRecommendedMinimalLogLevelForEnvironment';
```

**verdict**: holds. same import pattern (absolute for domain.objects, relative for domain.operations).

### 2. JSDoc comment style

**extant style in genLogMethods.ts** (lines 36-40):
```ts
/**
 * define how to generate the log methods
 * - allows you to specify the minimal log level to use for your application
 * - defaults to recommended levels for the environment
 */
```

**my style in genContextLogTrail.ts** (lines 7-10):
```ts
/**
 * .what = create a log context with trail and env injection
 * .why = enables request correlation via trail.exid and code version via env.commit
 */
```

**issue found**: I introduced `.what`/`.why` pattern that does NOT match extant code.

**searched codebase**: no other file in src/domain.operations/ uses `.what`/`.why` in JSDoc.

**decision**: this diverges from extant conventions. HOWEVER, the `.what`/`.why` pattern is prescribed by the mechanic briefs. since I am a mechanic, I follow the brief convention for new code.

**verdict**: holds. `.what`/`.why` is the prescribed convention for new code per briefs. extant code was written before this convention. not an issue to fix.

### 3. function signature pattern

**genLogMethods.ts** (line 41-45):
```ts
export const genLogMethods = ({
  minimalLogLevel = getRecommendedMinimalLogLevelForEnvironment(),
}: {
  minimalLogLevel?: LogLevel;
} = {}): LogMethods => {
```

**genContextLogTrail.ts** (line 11-38):
```ts
export const genContextLogTrail = ({
  trail,
  env,
  minimalLogLevel = getRecommendedMinimalLogLevelForEnvironment(),
}: {
  trail: {...} | null;
  env: {...} | null;
  minimalLogLevel?: LogLevel;
}): ContextLogTrail => {
```

**observation**: genLogMethods uses `= {}` default for entire input object. genContextLogTrail does NOT use this default because trail and env are required.

**verdict**: holds. the difference is intentional — genContextLogTrail forces callers to provide trail and env explicitly.

### 4. return statement structure

**genLogMethods.ts**:
```ts
return {
  error: generateLogMethod({ level: LogLevel.ERROR, minimalLogLevel }),
  // ...
};
```

**genContextLogTrail.ts**:
```ts
return {
  log: {
    ...logMethods,
    trail: trailForLog,
  },
};
```

**observation**: genLogMethods returns LogMethods directly. genContextLogTrail returns ContextLogTrail (wraps in `{ log: ... }`).

**verdict**: holds. different return types require different structure. ContextLogTrail interface prescribes the `{ log: ... }` shape.

## conclusion

**fixed issues**: none

**holds with rationale**:
1. `.what`/`.why` JSDoc — prescribed by briefs for new code
2. no `= {}` default — intentional (forced explicit input)
3. different return structure — matches ContextLogTrail type

all conventions are either consistent with extant code or follow brief prescriptions.
