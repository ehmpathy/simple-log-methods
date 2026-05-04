import { given, then, when } from 'test-fns';

import { LogLevel } from '@src/domain.objects/constants';
import type { LogEvent } from '@src/domain.objects/LogOutlet';

import { drainBuffer } from './drainBuffer';

describe('drainBuffer', () => {
  given('[case1] a buffer with events', () => {
    when('[t0] drained', () => {
      const buffer: LogEvent[] = [
        {
          level: LogLevel.INFO,
          timestamp: 't1',
          message: 'first',
          metadata: undefined,
        },
        {
          level: LogLevel.INFO,
          timestamp: 't2',
          message: 'second',
          metadata: undefined,
        },
      ];

      const result = drainBuffer(buffer);

      then('returns all events', () => {
        expect(result).toHaveLength(2);
        expect(result[0]!.message).toBe('first');
        expect(result[1]!.message).toBe('second');
        expect(result).toMatchSnapshot();
      });

      then('clears the original buffer', () => {
        expect(buffer).toHaveLength(0);
      });
    });
  });

  given('[case2] an empty buffer', () => {
    when('[t0] drained', () => {
      const buffer: LogEvent[] = [];
      const result = drainBuffer(buffer);

      then('returns empty array', () => {
        expect(result).toHaveLength(0);
        expect(result).toMatchSnapshot();
      });

      then('buffer remains empty', () => {
        expect(buffer).toHaveLength(0);
      });
    });
  });

  given('[case3] buffer drain is atomic', () => {
    when('[t0] drained', () => {
      const buffer: LogEvent[] = [
        {
          level: LogLevel.INFO,
          timestamp: 't1',
          message: 'one',
          metadata: undefined,
        },
      ];

      then('result and buffer reference different arrays', () => {
        const result = drainBuffer(buffer);
        buffer.push({
          level: LogLevel.INFO,
          timestamp: 't2',
          message: 'two',
          metadata: undefined,
        });

        // result should not be affected by push after drain
        expect(result).toHaveLength(1);
        expect(buffer).toHaveLength(1);
        expect({ drained: result, bufferAfter: buffer }).toMatchSnapshot();
      });
    });
  });
});
