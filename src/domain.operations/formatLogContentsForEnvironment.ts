import { UnexpectedCodePathError } from 'helpful-errors';

import {
  type LogLevel,
  SupportedEnvironment,
} from '@src/domain.objects/constants';
import type { LogTrail } from '@src/domain.objects/LogTrail';

import { identifyEnvironment } from './identifyEnvironment';

export const formatLogContentsForEnvironment = ({
  level,
  timestamp,
  message,
  metadata,
  trail,
  env,
}: {
  level: LogLevel;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
  trail?: LogTrail;
  env?: { commit: string };
}) => {
  const environment = identifyEnvironment();

  // build trail output: omit if not provided, omit exid if null
  const trailOutput = trail
    ? {
        ...(trail.exid !== null ? { exid: trail.exid } : {}),
        stack: trail.stack,
      }
    : undefined;

  // build env output: omit if not provided or commit is null
  const envOutput = env?.commit ? { commit: env.commit } : undefined;

  // if its a "local" environment, then dont stringify the contents - but stringify the metadata to cut down on visual noise
  if (environment === SupportedEnvironment.LOCAL) {
    return {
      level,
      timestamp,
      message,
      metadata: JSON.stringify(metadata), // json stringify it to cut down on the visual noise in the console
      ...(trailOutput ? { trail: trailOutput } : {}),
      ...(envOutput ? { env: envOutput } : {}),
    };
  }

  // if its an aws-lambda environment, then stringify the contents - without stringifying the metadata - to make sure log is fully readable and parseable by cloudwatch
  if (environment === SupportedEnvironment.AWS_LAMBDA) {
    return JSON.stringify({
      level,
      timestamp,
      message,
      metadata,
      ...(trailOutput ? { trail: trailOutput } : {}),
      ...(envOutput ? { env: envOutput } : {}),
    });
  }

  // if its a web-browser environment, then dont stringify the contents - nor the metadata - to make sure log is fully accessible through console devtools
  if (environment === SupportedEnvironment.WEB_BROWSER) {
    return {
      level,
      timestamp,
      message,
      metadata,
      ...(trailOutput ? { trail: trailOutput } : {}),
      ...(envOutput ? { env: envOutput } : {}),
    };
  }

  // if it was not one of the above, we have not supported this environment yet
  throw new UnexpectedCodePathError(
    'unsupported environment detected. this should never occur - and is a bug within sdk-logs',
  );
};
