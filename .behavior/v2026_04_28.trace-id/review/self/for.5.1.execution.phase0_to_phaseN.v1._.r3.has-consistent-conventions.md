# review.self: has-consistent-conventions

## review scope

examined all file names and function names in src/domain.operations/ for convention consistency.

## extant name conventions

### file names in domain.operations/

| file | prefix pattern |
|------|----------------|
| generateLogMethod.ts | generate* |
| genLogMethods.ts | gen* |
| genContextLogTrail.ts | gen* |
| formatLogContentsForEnvironment.ts | format* |
| identifyEnvironment.ts | identify* |
| getRecommendedMinimalLogLevelForEnvironment.ts | get* |
| withLogTrail.ts | with* |

### prefix patterns observed

| prefix | usage | what it does |
|--------|-------|---------|
| gen* | genLogMethods, genContextLogTrail | generate/create |
| generate* | generateLogMethod | generate (internal) |
| format* | formatLogContentsForEnvironment | transform |
| identify* | identifyEnvironment | detect/determine |
| get* | getRecommendedMinimalLogLevelForEnvironment | retrieve |
| with* | withLogTrail | wrapper/decorator |

## convention analysis

### observation: gen* vs generate* inconsistency

**files**:
- generateLogMethod.ts — uses "generate"
- genLogMethods.ts — uses "gen"
- genContextLogTrail.ts — uses "gen"

**question**: should generateLogMethod be renamed to genLogMethod for consistency?

**analysis**:
1. blueprint explicitly renamed generateLogMethods → genLogMethods
2. blueprint did NOT mention a rename of generateLogMethod
3. generateLogMethod is internal (not exported publicly)
4. genLogMethods and genContextLogTrail are public exports

**verdict**: holds. the inconsistency is intentional per blueprint. internal vs public distinction:
- generate*: internal atomic functions
- gen*: public composite functions

### observation: genContextLogTrail follows gen* pattern

**verified**: genContextLogTrail uses "gen" prefix, consistent with genLogMethods.

**verdict**: holds. follows extant convention.

### observation: test file names

**pattern**: `{name}.test.ts` for all test files

**verified**: genContextLogTrail.test.ts follows this pattern.

**verdict**: holds. consistent with extant convention.

### observation: LogTrail type name

**extant**: LogTrail (interface)

**new**: no new types introduced (reused extant LogTrail)

**verdict**: holds. no new term introduced.

## conclusion

all new names follow extant conventions:
1. gen* prefix for public functions — matches genLogMethods
2. *.test.ts for test files — matches extant pattern
3. reused extant type names (LogTrail, ContextLogTrail)

the generate* vs gen* inconsistency is intentional per blueprint (internal vs public).
