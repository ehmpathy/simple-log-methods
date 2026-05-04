import { given, then, when } from 'test-fns';

import { LogLevel } from '@src/domain.objects/constants';
import type { LogEvent } from '@src/domain.objects/LogOutlet';

import { asCloudWatchLogEvents } from './asCloudWatchLogEvents';

describe('asCloudWatchLogEvents', () => {
  given('[case1] a single log event', () => {
    when('[t0] transformed to CloudWatch format', () => {
      const event: LogEvent = {
        level: LogLevel.INFO,
        timestamp: '2026-05-03T12:00:00.000Z',
        message: 'test message',
        metadata: { key: 'value' },
      };

      then('timestamp is epoch ms', () => {
        const result = asCloudWatchLogEvents([event]);
        expect(result[0]!.timestamp).toBe(
          Date.parse('2026-05-03T12:00:00.000Z'),
        );
        expect(result).toMatchSnapshot();
      });

      then('message is JSON serialized event', () => {
        const result = asCloudWatchLogEvents([event]);
        expect(result[0]!.message).toBe(JSON.stringify(event));
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case2] multiple log events', () => {
    when('[t0] transformed to CloudWatch format', () => {
      const events: LogEvent[] = [
        {
          level: LogLevel.INFO,
          timestamp: '2026-05-03T12:00:00.000Z',
          message: 'first',
          metadata: undefined,
        },
        {
          level: LogLevel.ERROR,
          timestamp: '2026-05-03T12:00:01.000Z',
          message: 'second',
          metadata: { error: true },
        },
      ];

      then('order is preserved', () => {
        const result = asCloudWatchLogEvents(events);
        expect(result).toHaveLength(2);
        expect(JSON.parse(result[0]!.message).message).toBe('first');
        expect(JSON.parse(result[1]!.message).message).toBe('second');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case3] empty array', () => {
    when('[t0] transformed', () => {
      then('returns empty array', () => {
        const result = asCloudWatchLogEvents([]);
        expect(result).toEqual([]);
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case4] edge cases: minimal and boundary inputs', () => {
    when('[t0] event has empty message', () => {
      then('empty message is preserved', () => {
        const event: LogEvent = {
          level: LogLevel.DEBUG,
          timestamp: '2026-05-03T12:00:00.000Z',
          message: '',
          metadata: undefined,
        };
        const result = asCloudWatchLogEvents([event]);
        expect(JSON.parse(result[0]!.message).message).toBe('');
        expect(result).toMatchSnapshot();
      });
    });

    when('[t1] event has null metadata', () => {
      then('null metadata is serialized', () => {
        const event: LogEvent = {
          level: LogLevel.WARN,
          timestamp: '2026-05-03T12:00:00.000Z',
          message: 'caution event',
          metadata: null as unknown as undefined,
        };
        const result = asCloudWatchLogEvents([event]);
        expect(result).toHaveLength(1);
        expect(result).toMatchSnapshot();
      });
    });

    when('[t2] event has deeply nested metadata', () => {
      then('nested metadata is serialized', () => {
        const event: LogEvent = {
          level: LogLevel.INFO,
          timestamp: '2026-05-03T12:00:00.000Z',
          message: 'nested test',
          metadata: { a: { b: { c: { d: 'deep' } } } },
        };
        const result = asCloudWatchLogEvents([event]);
        expect(result).toHaveLength(1);
        expect(result).toMatchSnapshot();
      });
    });
  });
});
