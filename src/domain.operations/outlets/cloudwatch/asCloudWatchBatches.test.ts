import { given, then, when } from 'test-fns';

import { LogLevel } from '@src/domain.objects/constants';
import type { LogEvent } from '@src/domain.objects/LogOutlet';

import { asCloudWatchBatches } from './asCloudWatchBatches';

describe('asCloudWatchBatches', () => {
  given('[case1] empty events array', () => {
    when('[t0] batched', () => {
      then('should return empty array', () => {
        const result = asCloudWatchBatches([]);
        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] events within single batch limits', () => {
    const events: LogEvent[] = [
      {
        level: LogLevel.INFO,
        timestamp: '2026-05-04T12:00:00.000Z',
        message: 'test message 1',
      },
      {
        level: LogLevel.INFO,
        timestamp: '2026-05-04T12:00:01.000Z',
        message: 'test message 2',
      },
    ];

    when('[t0] batched', () => {
      then('should return single batch with all events', () => {
        const result = asCloudWatchBatches(events);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(events);
      });
    });
  });

  given('[case3] events exceed 10k count limit', () => {
    const events: LogEvent[] = Array.from({ length: 10_001 }, (_, i) => ({
      level: LogLevel.INFO,
      timestamp: '2026-05-04T12:00:00.000Z',
      message: `msg ${i}`,
    }));

    when('[t0] batched', () => {
      then('should split into multiple batches', () => {
        const result = asCloudWatchBatches(events);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0]).toHaveLength(10_000);
        expect(result[1]).toHaveLength(1);
      });
    });
  });

  given('[case4] events exceed 1MB size limit', () => {
    // each event ~100KB -> 11 events > 1MB
    const largeMessage = 'x'.repeat(100_000);
    const events: LogEvent[] = Array.from({ length: 11 }, (_, i) => ({
      level: LogLevel.INFO,
      timestamp: '2026-05-04T12:00:00.000Z',
      message: `${largeMessage}-${i}`,
    }));

    when('[t0] batched', () => {
      then('should split into multiple batches', () => {
        const result = asCloudWatchBatches(events);
        expect(result.length).toBeGreaterThan(1);
      });

      then('each batch should be under 1MB', () => {
        const result = asCloudWatchBatches(events);
        for (const batch of result) {
          const batchSize = batch.reduce(
            (sum, e) => sum + JSON.stringify(e).length + 27,
            0,
          );
          expect(batchSize).toBeLessThanOrEqual(1_048_576);
        }
      });
    });
  });
});
