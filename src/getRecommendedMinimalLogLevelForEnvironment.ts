import { isOfLogLevel, LogLevel, SupportedEnvironment } from './constants';
import { identifyEnvironment } from './identifyEnvironment';

const getLogLevelFromEnvVar = (): LogLevel | null => {
  // grab the log level env var
  const logLevelEnvVar = process.env.LOG_LEVEL || null; // cast falsy values to null

  // if log level wasn't defined, null
  if (!logLevelEnvVar) return null;

  // if log level wasn't defined w/ a valid value, warn and null
  if (!isOfLogLevel(logLevelEnvVar)) {
    // tslint:disable-next-line: no-console
    console.warn(`environmental variable LOG_LEVEL was set to an invalid value: '${logLevelEnvVar}'. using the default instead`);
    return null;
  }

  // if it was valid, then return it
  return logLevelEnvVar;
};

export const getRecommendedMinimalLogLevelForEnvironment = (): LogLevel => {
  // if the LOG_LEVEL env var is defined, then use what is specified by that
  const logLevelFromEnvVar = getLogLevelFromEnvVar();
  if (logLevelFromEnvVar) return logLevelFromEnvVar;

  // identify the env we're in
  const env = identifyEnvironment();

  // if we're in aws lambda env, then default to DEBUG - since cloudwatch costs are cheap and extra visibility is worth it in most cases
  if (env === SupportedEnvironment.AWS_LAMBDA) return LogLevel.DEBUG;

  // otherwise, default to INFO - to balance signal -vs- noise
  return LogLevel.INFO;
};
