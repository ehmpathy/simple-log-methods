import { given, then, when } from 'test-fns';

import { LogLevel } from '@src/domain.objects/constants';
import type { LogEvent, LogOutlet } from '@src/domain.objects/LogOutlet';

import { genLogMethods } from './genLogMethods';

describe('genLogMethods', () => {
  it('should create the log methods', () => {
    const log = genLogMethods();
    expect(log).toHaveProperty('error');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('debug');
  });

  given('[case1] outlets provided', () => {
    const createMockOutlet = (): LogOutlet & { events: LogEvent[] } => {
      const events: LogEvent[] = [];
      return {
        events,
        send: (event: LogEvent) => events.push(event),
        flush: async () => {},
      };
    };

    when('[t0] log methods called', () => {
      then('passes outlets to each log method', () => {
        const outlet = createMockOutlet();
        const log = genLogMethods({
          level: { minimum: LogLevel.DEBUG },
          outlets: [outlet],
        });

        log.info('info message');
        log.debug('debug message');
        log.warn('warn message');
        log.error('error message');

        expect(outlet.events).toHaveLength(4);
        // snapshot actual event content (redact timestamps for determinism)
        expect(
          outlet.events.map((e) => ({
            level: e.level,
            message: e.message,
            hasTimestamp: !!e.timestamp,
            hasMetadata: e.metadata !== undefined,
          })),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] no outlets provided', () => {
    when('[t0] log methods called', () => {
      then('works without outlets (backwards compat)', () => {
        const log = genLogMethods();
        // should not throw
        expect(() => log.info('test')).not.toThrow();
      });
    });
  });

  given('[case3] env provided', () => {
    const createMockOutlet = (): LogOutlet & { events: LogEvent[] } => {
      const events: LogEvent[] = [];
      return {
        events,
        send: (event: LogEvent) => events.push(event),
        flush: async () => {},
      };
    };

    when('[t0] log methods called', () => {
      then('passes env to each log method', () => {
        const outlet = createMockOutlet();
        const log = genLogMethods({
          level: { minimum: LogLevel.DEBUG },
          outlets: [outlet],
          env: { commit: 'main@abc123' },
        });

        log.info('info message');

        expect(outlet.events).toHaveLength(1);
        expect(outlet.events[0]?.env).toEqual({ commit: 'main@abc123' });
        // snapshot for vibecheck: shows full log event structure with env
        expect(
          outlet.events.map((e) => ({
            level: e.level,
            message: e.message,
            hasTimestamp: !!e.timestamp,
            hasEnv: e.env !== undefined,
            envCommit: e.env?.commit,
          })),
        ).toMatchSnapshot();
      });

      then('exposes env on LogMethods for withLogTrail composability', () => {
        const log = genLogMethods({
          env: { commit: 'main@abc123' },
        });

        expect(log.env).toEqual({ commit: 'main@abc123' });
      });
    });

    when('[t1] env is null', () => {
      then('env is omitted from log output', () => {
        const outlet = createMockOutlet();
        const log = genLogMethods({
          level: { minimum: LogLevel.DEBUG },
          outlets: [outlet],
          env: null,
        });

        log.info('info message');

        expect(outlet.events).toHaveLength(1);
        expect(outlet.events[0]?.env).toBeUndefined();
      });
    });
  });
});
