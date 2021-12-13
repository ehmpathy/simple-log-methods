import { SupportedEnvironment } from './constants';

/**
 * identifies the supported environment that this is being run in, as best as possible
 * - defaults to LOCAL environment, as it has the most common settings and is not distinguishable otherwise
 */
export const identifyEnvironment = (): SupportedEnvironment => {
  // check if its an aws-lambda runtime environment
  const isAwsLambdaEnvironment = !!process.env.AWS_LAMBDA_FUNCTION_NAME; // if this env var is defined, then its aws lambda env
  if (isAwsLambdaEnvironment) return SupportedEnvironment.AWS_LAMBDA;

  // default to local env
  return SupportedEnvironment.LOCAL;
};
