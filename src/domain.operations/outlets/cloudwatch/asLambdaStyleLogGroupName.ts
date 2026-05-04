import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * .what = generates a lambda-style log group name
 * .why = CloudWatch log groups follow `/aws/lambda/{service}-{env}` pattern
 *
 * .note = performs I/O when service is not provided:
 *         - reads package.json from cwd for service name
 *         - reads env vars (ENVIRONMENT_ACCESS, ENV_ACCESS, STAGE, NODE_ENV) for env.access
 *         for pure usage, pass both service and env.access explicitly.
 *
 * @param service - service name (default: reads from package.json)
 * @param env.access - environment access level (default: from env vars, fallback 'local')
 */
export const asLambdaStyleLogGroupName = ({
  service,
  env,
}: {
  service?: string;
  env?: { access?: string };
} = {}): string => {
  const serviceName = service ?? getPackageJsonName();
  const envAccess = env?.access ?? getEnvironmentAccessFromEnvVar();
  return `/aws/lambda/${serviceName}-${envAccess}`;
};

/**
 * .what = reads package name from package.json in cwd
 * .why = service name defaults to package name for consistency
 */
const getPackageJsonName = (): string => {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.name ?? 'unknown-service';
  } catch (error) {
    // allowlist: file not found or parse errors are expected in some environments
    if (
      error instanceof Error &&
      (error.message.includes('ENOENT') ||
        error.message.includes('Unexpected token') ||
        error.message.includes('JSON'))
    ) {
      return 'unknown-service';
    }
    throw error;
  }
};

/**
 * .what = reads environment access from env var
 * .why = enables environment-specific log groups (test, prep, prod)
 */
const getEnvironmentAccessFromEnvVar = (): string => {
  // check common env var patterns
  return (
    process.env.ENVIRONMENT_ACCESS ??
    process.env.ENV_ACCESS ??
    process.env.STAGE ??
    process.env.NODE_ENV ??
    'local'
  );
};
