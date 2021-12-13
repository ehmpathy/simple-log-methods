# simple-leveled-log-methods

a simple and opinionated logging library. plays well with aws lambda + cloudwatch.

# features

- distinguish different priorities of logs with standard levels
  - i.e., `log.debug`, `log.info`, `log.warn`, and `log.error`
- filter which levels of log to emit
  - i.e., choose based on environment whether to emit all logs or skip some of the logs
- utilizes `console.warn` and `console.log` under the hood
  - which ensures that the aws cloudwatch requestId is present on each log message automatically
- formats log metadata based on environment
  - i.e., stringify in local environments to reduce visual noise
  - i.e., don't stringify in aws-lambda environment for optimal cloudwatch parsing


# installation

```
npm install --save simple-leveled-log-methods
```

# usage

### init
```ts
// e.g., in `src/utils/log.ts
import { generateLogMethods } from 'simple-leveled-log-methods';

export const log = generateLogMethods();
```

### use in code
```ts
import { log } from '../utils/log';

log.error(`the sky is falling and we're loosing money!`, metadata); // use `.error` when you want someone to respond immediately, even if its 4am

log.warn(`this shouldn't be happening and should be looked at asap`, metadata); // use `.warn` when you want someone to look at it asap, but not wake up in the middle of the night

log.info(`we either want to or should keep track of this`, metadata); // use `.info` for anything we may be interested in knowing about

log.debug(`this will help debug if things go wrong`, metadata); // use this for any information that could help debug when things go wrong (e.g., request/response data)
```
