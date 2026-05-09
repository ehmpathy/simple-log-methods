import type { Environment } from 'sdk-environment';

import { LogLevel } from '@src/domain.objects/constants';
import type { ContextLogTrail, LogTrail } from '@src/domain.objects/LogTrail';

import { generateLogMethod } from './generateLogMethod';
import { getRecommendedMinimalLogLevelForEnvironment } from './getRecommendedMinimalLogLevelForEnvironment';

/**
 * .what = create a log context with trail and env injection
 * .why = enables request correlation via trail.exid and code version via env.commit
 */
export const genContextLogTrail = ({
  trail,
  env,
  level,
}: {
  /**
   * .what = the trail context for log correlation
   * .why = forces caller to explicitly provide or pass null
   */
  trail: {
    exid: string | null;
    stack: string[];
  } | null;

  /**
   * .what = the environment context
   * .why = forces caller to explicitly provide or pass null
   */
  env: Partial<Environment> | null;

  /**
   * .what = the minimum log level to emit
   * .why = allows filter of logs by level
   */
  level?: { minimum?: LogLevel };
}): ContextLogTrail => {
  // derive minimal log level
  const minimalLogLevel =
    level?.minimum ?? getRecommendedMinimalLogLevelForEnvironment();

  // build the trail object: only include if provided
  const trailForLog: LogTrail | undefined = trail
    ? { exid: trail.exid, stack: trail.stack }
    : undefined;

  // build the env object: pass through if provided
  const envForLog: Partial<Environment> | undefined = env ?? undefined;

  // generate the log methods with trail/env injected
  const logMethods = {
    error: generateLogMethod({
      level: LogLevel.ERROR,
      minimalLogLevel,
      trail: trailForLog,
      env: envForLog,
    }),
    warn: generateLogMethod({
      level: LogLevel.WARN,
      minimalLogLevel,
      trail: trailForLog,
      env: envForLog,
    }),
    info: generateLogMethod({
      level: LogLevel.INFO,
      minimalLogLevel,
      trail: trailForLog,
      env: envForLog,
    }),
    debug: generateLogMethod({
      level: LogLevel.DEBUG,
      minimalLogLevel,
      trail: trailForLog,
      env: envForLog,
    }),
  };

  // return the context with log methods, trail, env, and config
  return {
    log: {
      ...logMethods,
      trail: trailForLog,
      env: envForLog,
      _: Object.freeze({ level: minimalLogLevel }),
    },
  };
};
