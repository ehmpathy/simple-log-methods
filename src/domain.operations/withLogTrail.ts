import type {
  ProcedureContext,
  ProcedureInput,
  ProcedureOutput,
} from 'domain-glossary-procedure';
import { UnexpectedCodePathError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import { isAPromise, type Literalize } from 'type-fns';

import type { LogLevel } from '@src/domain.objects/constants';
import type { ContextLogTrail, LogTrail } from '@src/domain.objects/LogTrail';

import type { LogMethod } from './generateLogMethod';
import type { LogMethods } from './generateLogMethods';

const noOp = (...input: any) => input;
const omitContext = (...input: any) => input[0]; // standard pattern for args = [input, context]
const pickErrorMessage = (input: Error) => ({
  error: { message: input.message },
});
const roundToHundredths = (num: number) => Math.round(num * 100) / 100; // https://stackoverflow.com/a/14968691/3068233

const DEFAULT_DURATION_REPORT_THRESHOLD = process.env
  .VISUALOGIC_DURATION_THRESHOLD
  ? parseInt(process.env.VISUALOGIC_DURATION_THRESHOLD)
  : toMilliseconds({ seconds: 1 });

/**
 * enables input output logging and tracing for a method
 *
 * todo: - add tracing identifier w/ async-context
 * todo: - hookup visual tracing w/ external lib (vi...lo...)
 * todo: - bundle this with its own logging library which supports scoped logs
 */
export const withLogTrail = <TInput, TContext extends ContextLogTrail, TOutput>(
  logic: (input: TInput, context: TContext) => TOutput,
  {
    name: declaredName,
    log: logOptions,
    duration = {
      threshold: { milliseconds: DEFAULT_DURATION_REPORT_THRESHOLD },
    },
  }: {
    /**
     * specifies the name of the function, if the function does not have a name assigned already
     */
    name?: string;

    /**
     * enable redacting parts of the input or output from logging
     */
    log?: {
      /**
       * specifies the level to log the trail with
       *
       * note:
       * - defaults input & output logs to level .debug // todo: debug to .trail
       * - defaults error logs to level .warn
       * - error level is only overridable via the object form (to prevent accidental downgrade of error logs)
       */
      level?:
        | LogLevel
        | {
            input?: LogLevel;
            output?: LogLevel;
            error?: LogLevel;
          };

      /**
       * what of the input to log
       */
      input?: (...value: Parameters<typeof logic>) => any;

      /**
       * what of the output to log
       */
      output?: (value: Awaited<ReturnType<typeof logic>>) => any;

      /**
       * what of the error to log
       */
      error?: (error: Error) => any;
    };

    /**
     * specifies the threshold after which a duration will be included on the output log
     */
    duration?: {
      threshold: IsoDuration;
    };
  },
): typeof logic => {
  // cache the name of the function per wrapping
  const name: string | null = logic.name || declaredName || null; // use `\\` since `logic.name` returns `""` for anonymous functions

  // if no name is identifiable, throw an error here to fail fast
  if (!name)
    throw new UnexpectedCodePathError(
      'could not identify name for wrapped function',
    );

  // if the name specified does not match the name of the function, throw an error here to fail fast
  if (declaredName && name !== declaredName)
    throw new UnexpectedCodePathError(
      'the natural name of the function is different than the declared name',
      { declaredName, naturalName: name },
    );

  // extract the log levels per operation
  const logLevelInput: Literalize<LogLevel> =
    (typeof logOptions?.level === 'object'
      ? logOptions.level.input
      : logOptions?.level) ?? 'debug';
  const logLevelOutput: Literalize<LogLevel> =
    (typeof logOptions?.level === 'object'
      ? logOptions.level.output
      : logOptions?.level) ?? 'debug';
  const logLevelError: Literalize<LogLevel> =
    // note: error level is only overridable via the object form, to prevent `level: 'info'` from accidentally downgrading error logs
    (typeof logOptions?.level === 'object' ? logOptions.level.error : null) ??
    'warn';

  // extract the log methods
  const logInputMethod = logOptions?.input ?? omitContext;
  const logOutputMethod = logOptions?.output ?? noOp;
  const logErrorMethod = logOptions?.error ?? pickErrorMessage;

  // define the duration threshold
  const durationReportingThreshold = duration.threshold;
  const durationReportingThresholdInSeconds =
    toMilliseconds(durationReportingThreshold) / 1000;

  // wrap the function
  return (
    input: ProcedureInput<typeof logic>,
    context: ProcedureContext<typeof logic>,
  ): ProcedureOutput<typeof logic> => {
    // now log the input
    context.log[logLevelInput](`${name}.input`, {
      input: logInputMethod(input, context),
    });

    // begin tracking duration
    const startTimeInMilliseconds = new Date().getTime();

    // define the context.log method that will be given to the logic
    const logMethodsWithContext: LogMethods & { _orig: LogMethods } & {
      trail: LogTrail;
    } = {
      // add the trail
      trail: [...(context.log.trail ?? []), name],

      // track the orig logger
      _orig: context.log?._orig ?? context.log,

      // add the scoped methods
      debug: (
        message: Parameters<LogMethod>[0],
        metadata: Parameters<LogMethod>[1],
      ) => context.log.debug(`${name}.progress: ${message}`, metadata),
      info: (
        message: Parameters<LogMethod>[0],
        metadata: Parameters<LogMethod>[1],
      ) => context.log.info(`${name}.progress: ${message}`, metadata),
      warn: (
        message: Parameters<LogMethod>[0],
        metadata: Parameters<LogMethod>[1],
      ) => context.log.warn(`${name}.progress: ${message}`, metadata),
      error: (
        message: Parameters<LogMethod>[0],
        metadata: Parameters<LogMethod>[1],
      ) => context.log.error(`${name}.progress: ${message}`, metadata),
    };

    // define what to do when we have an error
    const logError = (error: Error) => {
      const endTimeInMilliseconds = new Date().getTime();
      const durationInMilliseconds =
        endTimeInMilliseconds - startTimeInMilliseconds;
      const durationInSeconds = roundToHundredths(durationInMilliseconds / 1e3); // https://stackoverflow.com/a/53970656/3068233
      context.log[logLevelError](`${name}.error`, {
        input: logInputMethod(input, context),
        output: logErrorMethod(error),
        ...(durationInSeconds >= durationReportingThresholdInSeconds
          ? { duration: `${durationInSeconds} sec` } // only include the duration if the threshold was crossed
          : {}),
      });
    };

    // now execute the method, wrapped to catch sync errors
    let result: ProcedureOutput<typeof logic>;
    try {
      result = logic(input, {
        ...context,
        log: logMethodsWithContext,
      } as TContext);
    } catch (error) {
      // log the error for sync functions that throw
      if (error instanceof Error) logError(error);
      throw error;
    }

    // if the result was a promise, log when that method crosses the reporting threshold, to identify which procedures are slow
    if (isAPromise(result)) {
      // define how to log the breach, on breach
      const onDurationBreach = () =>
        context.log[logLevelOutput](`${name}.duration.breach`, {
          input: logInputMethod(input, context),
          already: { duration: `${durationReportingThresholdInSeconds} sec` },
        });

      // define a timeout which will trigger on duration threshold
      const onBreachTrigger = setTimeout(
        onDurationBreach,
        durationReportingThresholdInSeconds * 1000,
      );

      // remove the timeout when the operation completes, to prevent logging if completes before duration
      void result
        .finally(() => clearTimeout(onBreachTrigger))
        .catch(() => {
          // do nothing when there's an error; just catch it, to ensure it doesn't get propagated further as an uncaught exception
        });
    }

    // define what to do when we have output
    const logOutput = (output: Awaited<ProcedureOutput<typeof logic>>) => {
      const endTimeInMilliseconds = new Date().getTime();
      const durationInMilliseconds =
        endTimeInMilliseconds - startTimeInMilliseconds;
      const durationInSeconds = roundToHundredths(durationInMilliseconds / 1e3); // https://stackoverflow.com/a/53970656/3068233
      context.log[logLevelOutput](`${name}.output`, {
        input: logInputMethod(input, context),
        output: logOutputMethod(output),
        ...(durationInSeconds >= durationReportingThresholdInSeconds
          ? { duration: `${durationInSeconds} sec` } // only include the duration if the threshold was crossed
          : {}),
      });
    };

    // if result is a promise, ensure we log after the output resolves
    if (isAPromise(result))
      return result
        .then((output: Awaited<ProcedureOutput<typeof logic>>) => {
          logOutput(output);
          return output;
        })
        .catch((error: Error) => {
          logError(error);
          throw error;
        }) as TOutput;

    // otherwise, its not a promise, so its done, so log now and return the result
    logOutput(result as Awaited<ProcedureOutput<typeof logic>>);
    return result;
  };
};
