import { SupportedEnvironment } from './constants';
import { identifyEnvironment } from './identifyEnvironment';

/**
 * define how to format the metadata for the environment
 */
export const formatMetadataForEnvironment = (metadata: any) => {
  const env = identifyEnvironment();

  // if we're in the local environment, json stringify it to cut down on the visual noise in the console
  if (env === SupportedEnvironment.LOCAL) return JSON.stringify(metadata);

  // otherwise, dont format it in any special way
  return metadata;
};
