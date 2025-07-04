import { Procedure, ProcedureContext } from 'domain-glossary-procedure';

import { LogMethods } from '../logic/generateLogMethods';

/**
 * .what = the procedure invocation trail
 */
export type LogTrail = string[];

export interface ContextLogTrail {
  /**
   * .what = the log methods which can be used
   */
  log: LogMethods & { _orig?: LogMethods }; // todo: support ".scope" as a first class attribute of log methods to avoid having to track original log object

  /**
   * .what = the log trail which has been collected
   */
  trail?: LogTrail;
}

export type HasContextLogTrail<T extends Procedure> =
  ProcedureContext<T> extends ContextLogTrail ? T : never;
