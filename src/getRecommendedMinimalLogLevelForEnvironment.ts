import { isOfLogLevel, LogLevel, SupportedEnvironment } from './constants';
import { identifyEnvironment } from './identifyEnvironment';

const getLogLevelFromEnvVar = (): LogLevel | null => {
  // if LOG_LEVEL was specified, use that
  const logLevelEnvVar = process.env.LOG_LEVEL || null; // cast falsy values to null
  if (logLevelEnvVar) {
    // if the log level is valid, use it
    if (isOfLogLevel(logLevelEnvVar)) return logLevelEnvVar;

    // otherwise, warn and continue to attempt other options
    console.warn(`environmental variable LOG_LEVEL was set to an invalid value: '${logLevelEnvVar}'. using the default instead`);
  }

  // if LOG_DEBUG was specified as true, use that (it's a common intuitive alias)
  const logDebugEnvVar = process.env.LOG_DEBUG || null;
  if (logDebugEnvVar === 'true') return LogLevel.DEBUG;

  // todo: consider supporting other LOG_${level} options

  // otherwise, null
  return null;
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
