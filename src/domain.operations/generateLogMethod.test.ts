import { given, then, when } from 'test-fns';

import { LogLevel } from '@src/domain.objects/constants';
import type { LogEvent, LogOutlet } from '@src/domain.objects/LogOutlet';

import { generateLogMethod } from './generateLogMethod';

describe('generateLogMethod', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should generate a method that outputs to console.log if below warn level', () => {
    const spy = jest.spyOn(console, 'log');
    const logError = generateLogMethod({
      level: LogLevel.INFO,
      minimalLogLevel: LogLevel.DEBUG,
    });
    logError('testMessage');
    expect(spy).toHaveBeenCalledTimes(1);
    expect({
      callCount: spy.mock.calls.length,
      usedConsoleLog: true,
    }).toMatchSnapshot();
  });
  it('should generate a method that outputs to console.warn if at or above warn level', () => {
    const spy = jest.spyOn(console, 'warn');
    const logError = generateLogMethod({
      level: LogLevel.ERROR,
      minimalLogLevel: LogLevel.DEBUG,
    });
    logError('testMessage');
    expect(spy).toHaveBeenCalledTimes(1);
    expect({
      callCount: spy.mock.calls.length,
      usedConsoleWarn: true,
    }).toMatchSnapshot();
  });
  it('should generate a method that outputs timestamp, level, message, and metadata', () => {
    const spy = jest.spyOn(console, 'warn');
    const logError = generateLogMethod({
      level: LogLevel.ERROR,
      minimalLogLevel: LogLevel.DEBUG,
    });
    logError('testMessage', { nested: { object: true } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.ERROR,
        message: 'testMessage',
        metadata: JSON.stringify({ nested: { object: true } }),
      }),
    );
    expect(spy.mock.calls[0]![0]).toHaveProperty('timestamp');
    // snapshot the output structure (redact timestamp for determinism)
    const output = spy.mock.calls[0]![0] as Record<string, unknown>;
    expect({
      level: output.level,
      message: output.message,
      metadata: output.metadata,
      hasTimestamp: 'timestamp' in output,
    }).toMatchSnapshot();
  });
  it('should not output anything if level is below minimum', () => {
    const spy = jest.spyOn(console, 'log');
    const logDebug = generateLogMethod({
      level: LogLevel.DEBUG,
      minimalLogLevel: LogLevel.WARN,
    });
    logDebug('testMessage');
    expect(spy).not.toHaveBeenCalled();
    expect({
      callCount: spy.mock.calls.length,
      wasSilent: true,
    }).toMatchSnapshot();
  });

  given('[case5] outlets provided', () => {
    const createMockOutlet = (): LogOutlet & { events: LogEvent[] } => {
      const events: LogEvent[] = [];
      return {
        events,
        send: (event: LogEvent) => events.push(event),
        flush: async () => {},
      };
    };

    when('[t0] log method called', () => {
      then('calls outlet.send with LogEvent', () => {
        const outlet = createMockOutlet();
        const logInfo = generateLogMethod({
          level: LogLevel.INFO,
          minimalLogLevel: LogLevel.DEBUG,
          outlets: [outlet],
        });
        logInfo('test message', { key: 'value' });

        expect(outlet.events).toHaveLength(1);
        expect(outlet.events[0]).toMatchObject({
          level: LogLevel.INFO,
          message: 'test message',
          metadata: { key: 'value' },
        });
        expect(outlet.events[0]?.timestamp).toBeDefined();
        // snapshot event structure (redact timestamp for determinism)
        expect({
          level: outlet.events[0]?.level,
          message: outlet.events[0]?.message,
          metadata: outlet.events[0]?.metadata,
          hasTimestamp: !!outlet.events[0]?.timestamp,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case6] multiple outlets provided', () => {
    const createMockOutlet = (): LogOutlet & { events: LogEvent[] } => {
      const events: LogEvent[] = [];
      return {
        events,
        send: (event: LogEvent) => events.push(event),
        flush: async () => {},
      };
    };

    when('[t0] log method called', () => {
      then('calls all outlets', () => {
        const outlet1 = createMockOutlet();
        const outlet2 = createMockOutlet();
        const logInfo = generateLogMethod({
          level: LogLevel.INFO,
          minimalLogLevel: LogLevel.DEBUG,
          outlets: [outlet1, outlet2],
        });
        logInfo('test message');

        expect(outlet1.events).toHaveLength(1);
        expect(outlet2.events).toHaveLength(1);
        expect({
          outlet1EventCount: outlet1.events.length,
          outlet2EventCount: outlet2.events.length,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case7] outlet.send throws', () => {
    when('[t0] log method called', () => {
      then('error propagates to caller (fail-fast)', () => {
        const failOutlet: LogOutlet = {
          send: () => {
            throw new Error('outlet failed');
          },
          flush: async () => {},
        };
        const logInfo = generateLogMethod({
          level: LogLevel.INFO,
          minimalLogLevel: LogLevel.DEBUG,
          outlets: [failOutlet],
        });

        // fail-fast: error should propagate, not be swallowed
        let errorMessage: string | undefined;
        try {
          logInfo('test message');
        } catch (e) {
          errorMessage = (e as Error).message;
        }
        expect(errorMessage).toBe('outlet failed');
        expect({ errorMessage, failFast: true }).toMatchSnapshot();
      });
    });
  });

  given('[case8] level below minimum with outlets', () => {
    const createMockOutlet = (): LogOutlet & { events: LogEvent[] } => {
      const events: LogEvent[] = [];
      return {
        events,
        send: (event: LogEvent) => events.push(event),
        flush: async () => {},
      };
    };

    when('[t0] log method called', () => {
      then('does not call outlets', () => {
        const outlet = createMockOutlet();
        const logDebug = generateLogMethod({
          level: LogLevel.DEBUG,
          minimalLogLevel: LogLevel.WARN,
          outlets: [outlet],
        });
        logDebug('test message');

        expect(outlet.events).toHaveLength(0);
        expect({
          outletEventCount: outlet.events.length,
          wasSilent: true,
        }).toMatchSnapshot();
      });
    });
  });
});
