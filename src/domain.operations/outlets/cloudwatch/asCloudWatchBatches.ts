import type { LogEvent } from '@src/domain.objects/LogOutlet';

import { computeLogEventSize } from './computeLogEventSize';

/**
 * .what = CloudWatch PutLogEvents limits
 * .why = CloudWatch rejects batches that exceed these limits
 *
 * @see https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html
 */
const CLOUDWATCH_MAX_BATCH_SIZE = 1_048_576; // 1MB
const CLOUDWATCH_MAX_BATCH_COUNT = 10_000;
const CLOUDWATCH_EVENT_OVERHEAD = 26; // bytes per event

/**
 * .what = splits log events into CloudWatch-compliant batches
 * .why = CloudWatch rejects batches over 1MB or 10k events
 *
 * @returns array of batches, each within CloudWatch limits
 */
export const asCloudWatchBatches = (events: LogEvent[]): LogEvent[][] => {
  if (events.length === 0) return [];

  const batches: LogEvent[][] = [];
  let currentBatch: LogEvent[] = [];
  let currentBatchSize = 0;

  for (const event of events) {
    const eventSize = computeLogEventSize(event) + CLOUDWATCH_EVENT_OVERHEAD;

    // check if event would exceed batch limits
    const wouldExceedSize =
      currentBatchSize + eventSize > CLOUDWATCH_MAX_BATCH_SIZE;
    const wouldExceedCount = currentBatch.length >= CLOUDWATCH_MAX_BATCH_COUNT;

    // start new batch if limits exceeded
    if (currentBatch.length > 0 && (wouldExceedSize || wouldExceedCount)) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBatchSize = 0;
    }

    currentBatch.push(event);
    currentBatchSize += eventSize;
  }

  // push final batch if non-empty
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
};
