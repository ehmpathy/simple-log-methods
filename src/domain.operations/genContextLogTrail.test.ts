import { given, then, when } from 'test-fns';

import { LogLevel, SupportedEnvironment } from '@src/domain.objects/constants';

import { genContextLogTrail } from './genContextLogTrail';
import { identifyEnvironment } from './identifyEnvironment';

jest.mock('./identifyEnvironment');
const identifyEnvironmentMock = identifyEnvironment as jest.Mock;

describe('genContextLogTrail', () => {
  beforeEach(() => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
  });

  given('[case1] trail and env are provided', () => {
    when('[t0] genContextLogTrail is called', () => {
      then('it returns context with log methods', () => {
        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: [] },
          env: { commit: 'a1b2c3d' },
        });
        expect(context.log).toBeDefined();
        expect(context.log.debug).toBeInstanceOf(Function);
        expect(context.log.info).toBeInstanceOf(Function);
        expect(context.log.warn).toBeInstanceOf(Function);
        expect(context.log.error).toBeInstanceOf(Function);
      });

      then('context.log.trail returns current trail state', () => {
        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: ['outer'] },
          env: { commit: 'a1b2c3d' },
        });
        expect(context.log.trail).toEqual({
          exid: 'req_abc',
          stack: ['outer'],
        });
      });
    });

    when('[t1] log method is called', () => {
      then('output includes trail.exid', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: [] },
          env: { commit: 'a1b2c3d' },
        });
        context.log.info('test message');
        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output).toMatchObject({
          trail: { exid: 'req_abc', stack: [] },
        });
        consoleSpy.mockRestore();
      });

      then('output includes env.commit', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: [] },
          env: { commit: 'a1b2c3d' },
        });
        context.log.info('test message');
        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output).toMatchObject({
          env: { commit: 'a1b2c3d' },
        });
        consoleSpy.mockRestore();
      });
    });
  });

  given('[case2] trail is null', () => {
    when('[t0] log method is called', () => {
      then('output omits trail object', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const context = genContextLogTrail({
          trail: null,
          env: { commit: 'a1b2c3d' },
        });
        context.log.info('test message');
        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output).not.toHaveProperty('trail');
        consoleSpy.mockRestore();
      });
    });
  });

  given('[case3] trail.exid is null', () => {
    when('[t0] log method is called', () => {
      then('output omits exid but includes stack', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const context = genContextLogTrail({
          trail: { exid: null, stack: ['outer'] },
          env: { commit: 'a1b2c3d' },
        });
        context.log.info('test message');
        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output.trail).toEqual({ stack: ['outer'] });
        expect(output.trail).not.toHaveProperty('exid');
        consoleSpy.mockRestore();
      });
    });
  });

  given('[case4] env is null', () => {
    when('[t0] log method is called', () => {
      then('output omits env object', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: [] },
          env: null,
        });
        context.log.info('test message');
        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output).not.toHaveProperty('env');
        consoleSpy.mockRestore();
      });
    });
  });

  given('[case5] env.commit is null', () => {
    when('[t0] log method is called', () => {
      then('output omits env object', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: [] },
          env: { commit: null },
        });
        context.log.info('test message');
        expect(consoleSpy).toHaveBeenCalled();
        const output = consoleSpy.mock.calls[0]?.[0];
        expect(output).not.toHaveProperty('env');
        consoleSpy.mockRestore();
      });
    });
  });

  given('[case6] all log levels', () => {
    when('[t0] each log level is called', () => {
      then('all include trail and env', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const context = genContextLogTrail({
          trail: { exid: 'req_abc', stack: [] },
          env: { commit: 'a1b2c3d' },
          minimalLogLevel: LogLevel.DEBUG,
        });

        context.log.debug('debug msg');
        context.log.info('info msg');
        context.log.warn('warn msg');
        context.log.error('error msg');

        // debug and info use console.log
        expect(logSpy).toHaveBeenCalledTimes(2);
        for (const call of logSpy.mock.calls) {
          expect(call[0]).toMatchObject({
            trail: { exid: 'req_abc', stack: [] },
            env: { commit: 'a1b2c3d' },
          });
        }

        // warn and error use console.warn
        expect(warnSpy).toHaveBeenCalledTimes(2);
        for (const call of warnSpy.mock.calls) {
          expect(call[0]).toMatchObject({
            trail: { exid: 'req_abc', stack: [] },
            env: { commit: 'a1b2c3d' },
          });
        }

        logSpy.mockRestore();
        warnSpy.mockRestore();
      });
    });
  });
});
