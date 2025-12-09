import type { Procedure, ProcedureContext } from 'domain-glossary-procedure';

import type { LogMethods } from '../logic/generateLogMethods';

/**
 * .what = the procedure invocation trail
 */
export type LogTrail = string[];

export interface ContextLogTrail {
  /**
   * .what = the log context which can be used; methods, trail, etc
   */
  log: LogMethods & {
    // todo: support ".scope" as a first class attribute of log methods to avoid having to track original log object
    _orig?: LogMethods;
  } & {
    /**
     * .what = the log trail which has been collected
     */
    trail?: LogTrail;
  };
}

export type HasContextLogTrail<T extends Procedure> =
  ProcedureContext<T> extends ContextLogTrail ? T : never;
