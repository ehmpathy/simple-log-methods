import type { LogEvent } from '@src/domain.objects/LogOutlet';

/**
 * .what = transforms LogEvents to CloudWatch PutLogEvents format
 * .why = extracts decode-friction from orchestrator
 */
export const asCloudWatchLogEvents = (
  events: LogEvent[],
): Array<{ timestamp: number; message: string }> => {
  return events.map((e) => ({
    timestamp: Date.parse(e.timestamp),
    message: JSON.stringify(e),
  }));
};
