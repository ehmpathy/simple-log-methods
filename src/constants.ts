import { createIsOfEnum } from 'simple-type-guards';

/**
 * define the supported log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}
export const isOfLogLevel = createIsOfEnum(LogLevel);

/**
 * define specifically supported environments
 */
export enum SupportedEnvironment {
  /**
   * the local environment balances information -vs- oversharing
   * - metadata is stringified to not cause too much visual "noise" in the console
   * - log level should default to being conservatively balanced, to reduce noise in the console
   *   - especially when considering the ease of retrying requests with more permissive log-level specified
   */
  LOCAL = 'LOCAL',

  /**
   * the aws environment has a few extra considerations for logging
   * - metadata should not be json-stringified, and should be simply nested instead for cloudwatch insights parsing
   * - log level should default to be more permissive, as cloudwatch costs are low enough to be worth the increased visibility in most cases
   */
  AWS_LAMBDA = 'AWS_LAMBDA',

  /**
   * the web browser environment allows us to focus on accessibility of information
   * - the metadata should not be json-stringified. instead, it should be simply nested for devtools console accessibility
   * - log level should default to being conservatively balanced, to reduce noise in the console
   *   - especially when considering the ease of retrying requests with more permissive log-level specified
   */
  WEB_BROWSER = 'WEB_BROWSER',
}
