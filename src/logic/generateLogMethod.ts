import { LogLevel } from '../domain/constants';
import { formatLogContentsForEnvironment } from './formatLogContentsForEnvironment';

/*
  define priority order of log levels and make it easy to ask questions about
*/
const logLevelPriorityOrder = [
  LogLevel.ERROR,
  LogLevel.WARN,
  LogLevel.INFO,
  LogLevel.DEBUG,
];
const aIsEqualOrMoreImportantThanB = ({ a, b }: { a: LogLevel; b: LogLevel }) =>
  logLevelPriorityOrder.indexOf(a) - logLevelPriorityOrder.indexOf(b) <= 0;

/*
  define how to generate a log method
  - i.e.,:
    - define when allowed to emit a log (i.e., when level > minimalLogLevel)
    - define the format of the log message (json w/ level, timestamp, message, metadata)
    - define the transport of the message (console.log / console.warn)
*/
export type LogMethod = (message: string, metadata: any) => void;
export const generateLogMethod = ({
  level,
  minimalLogLevel,
}: {
  level: LogLevel;
  minimalLogLevel: LogLevel;
}) => {
  return (message: string, metadata?: object) => {
    if (aIsEqualOrMoreImportantThanB({ a: level, b: minimalLogLevel })) {
      // determine the console level (i.e., use warn if we can to make the logs stand out more)
      const consoleMethod = aIsEqualOrMoreImportantThanB({
        a: level,
        b: LogLevel.WARN,
      })
        ? console.warn
        : console.log; // tslint:disable-line no-console

      // output the message to console, which will get picked up by cloudwatch when deployed lambda is invoked
      consoleMethod(
        formatLogContentsForEnvironment({
          level,
          timestamp: new Date().toISOString(),
          message,
          metadata,
        }),
      );
    }
  };
};
