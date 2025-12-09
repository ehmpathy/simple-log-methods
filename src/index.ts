export { LogLevel } from './domain/constants';
export type {
  ContextLogTrail,
  HasContextLogTrail,
  LogTrail,
} from './domain/LogTrail';
export type { LogMethod } from './logic/generateLogMethod';
export type { LogMethods } from './logic/generateLogMethods';
export { generateLogMethods } from './logic/generateLogMethods';
export { withLogTrail } from './logic/withLogTrail';
