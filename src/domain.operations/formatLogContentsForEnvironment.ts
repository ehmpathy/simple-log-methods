import {
  type LogLevel,
  SupportedEnvironment,
} from '@src/domain.objects/constants';

import { identifyEnvironment } from './identifyEnvironment';

export const formatLogContentsForEnvironment = ({
  level,
  timestamp,
  message,
  metadata,
}: {
  level: LogLevel;
  timestamp: string;
  message: string;
  metadata?: Record<string, any>;
}) => {
  const env = identifyEnvironment();

  // if its a "local" environment, then dont stringify the contents - but stringify the metadata to cut down on visual noise
  if (env === SupportedEnvironment.LOCAL) {
    return {
      level,
      timestamp,
      message,
      metadata: JSON.stringify(metadata), // json stringify it to cut down on the visual noise in the console
    };
  }

  // if its an aws-lambda environment, then stringify the contents - without stringifying the metadata - to make sure log is fully readable and parseable by cloudwatch
  if (env === SupportedEnvironment.AWS_LAMBDA) {
    return JSON.stringify({
      level,
      timestamp,
      message,
      metadata,
    });
  }

  // if its a web-browser environment, then dont stringify the contents - nor the metadata - to make sure log is fully accessible through console devtools
  if (env === SupportedEnvironment.WEB_BROWSER) {
    return {
      level,
      timestamp,
      message,
      metadata,
    };
  }

  // if it was not one of the above, we have not supported this environment yet
  throw new Error(
    'unsupported environment detected. this should never occur - and is a bug within simple-log-methods',
  ); // fail fast
};
