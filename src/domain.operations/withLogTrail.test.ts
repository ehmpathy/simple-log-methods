import { LogLevel } from '@src/domain.objects/constants';

import type { LogMethods } from './generateLogMethods';
import { withLogTrail } from './withLogTrail';

const createMockLogMethods = (): LogMethods & {
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
} => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('withLogTrail', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('log.level', () => {
    describe('default behavior (no level specified)', () => {
      it('should use debug level for input logging', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {});

        wrapped('hello', { log: mockLog });

        expect(mockLog.debug).toHaveBeenCalledWith(
          'testFunction.input',
          expect.any(Object),
        );
      });

      it('should use debug level for output logging', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {});

        wrapped('hello', { log: mockLog });

        expect(mockLog.debug).toHaveBeenCalledWith(
          'testFunction.output',
          expect.any(Object),
        );
      });

      it('should use warn level for error logging', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(_input: string): string {
          throw new Error('test error');
        };
        const wrapped = withLogTrail(testFn, {});

        expect(() => wrapped('hello', { log: mockLog })).toThrow('test error');
        expect(mockLog.warn).toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
      });
    });

    describe('single level specified', () => {
      it('should use the specified level for input logging', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, { log: { level: LogLevel.INFO } });

        wrapped('hello', { log: mockLog });

        expect(mockLog.info).toHaveBeenCalledWith(
          'testFunction.input',
          expect.any(Object),
        );
        expect(mockLog.debug).not.toHaveBeenCalled();
      });

      it('should use the specified level for output logging', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, { log: { level: LogLevel.INFO } });

        wrapped('hello', { log: mockLog });

        expect(mockLog.info).toHaveBeenCalledWith(
          'testFunction.output',
          expect.any(Object),
        );
      });

      it('should not allow single level to downgrade error logging from warn', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(_input: string): string {
          throw new Error('test error');
        };
        // even though we specify INFO level, error logs should remain at WARN
        const wrapped = withLogTrail(testFn, { log: { level: LogLevel.INFO } });

        expect(() => wrapped('hello', { log: mockLog })).toThrow('test error');
        expect(mockLog.warn).toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
        expect(mockLog.info).not.toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
      });

      it('should not allow single debug level to downgrade error logging from warn', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(_input: string): string {
          throw new Error('test error');
        };
        // even though we specify DEBUG level, error logs should remain at WARN
        const wrapped = withLogTrail(testFn, {
          log: { level: LogLevel.DEBUG },
        });

        expect(() => wrapped('hello', { log: mockLog })).toThrow('test error');
        expect(mockLog.warn).toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
        expect(mockLog.debug).not.toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
      });
    });

    describe('object with individual levels', () => {
      it('should use the specified input level', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { input: LogLevel.INFO } },
        });

        wrapped('hello', { log: mockLog });

        expect(mockLog.info).toHaveBeenCalledWith(
          'testFunction.input',
          expect.any(Object),
        );
      });

      it('should use the specified output level', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { output: LogLevel.WARN } },
        });

        wrapped('hello', { log: mockLog });

        expect(mockLog.warn).toHaveBeenCalledWith(
          'testFunction.output',
          expect.any(Object),
        );
      });

      it('should use the specified error level', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(_input: string): string {
          throw new Error('test error');
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { error: LogLevel.ERROR } },
        });

        expect(() => wrapped('hello', { log: mockLog })).toThrow('test error');
        expect(mockLog.error).toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
      });

      it('should allow specifying different levels for each operation', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: {
            level: {
              input: LogLevel.DEBUG,
              output: LogLevel.INFO,
              error: LogLevel.ERROR,
            },
          },
        });

        wrapped('hello', { log: mockLog });

        expect(mockLog.debug).toHaveBeenCalledWith(
          'testFunction.input',
          expect.any(Object),
        );
        expect(mockLog.info).toHaveBeenCalledWith(
          'testFunction.output',
          expect.any(Object),
        );
      });

      it('should default to debug for input when not specified in object', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { output: LogLevel.INFO } },
        });

        wrapped('hello', { log: mockLog });

        expect(mockLog.debug).toHaveBeenCalledWith(
          'testFunction.input',
          expect.any(Object),
        );
      });

      it('should default to debug for output when not specified in object', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { input: LogLevel.INFO } },
        });

        wrapped('hello', { log: mockLog });

        expect(mockLog.debug).toHaveBeenCalledWith(
          'testFunction.output',
          expect.any(Object),
        );
      });

      it('should default to warn for error when not specified in object', () => {
        const mockLog = createMockLogMethods();
        const testFn = function testFunction(_input: string): string {
          throw new Error('test error');
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { input: LogLevel.INFO, output: LogLevel.INFO } },
        });

        expect(() => wrapped('hello', { log: mockLog })).toThrow('test error');
        expect(mockLog.warn).toHaveBeenCalledWith(
          'testFunction.error',
          expect.any(Object),
        );
      });
    });

    describe('async functions', () => {
      it('should use specified levels for async function input', async () => {
        const mockLog = createMockLogMethods();
        const testFn = async function testAsyncFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { input: LogLevel.INFO } },
        });

        await wrapped('hello', { log: mockLog });

        expect(mockLog.info).toHaveBeenCalledWith(
          'testAsyncFunction.input',
          expect.any(Object),
        );
      });

      it('should use specified levels for async function output', async () => {
        const mockLog = createMockLogMethods();
        const testFn = async function testAsyncFunction(input: string) {
          return input.toUpperCase();
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { output: LogLevel.INFO } },
        });

        await wrapped('hello', { log: mockLog });

        expect(mockLog.info).toHaveBeenCalledWith(
          'testAsyncFunction.output',
          expect.any(Object),
        );
      });

      it('should use specified levels for async function error', async () => {
        const mockLog = createMockLogMethods();
        const testFn = async function testAsyncFunction(
          _input: string,
        ): Promise<string> {
          throw new Error('async test error');
        };
        const wrapped = withLogTrail(testFn, {
          log: { level: { error: LogLevel.ERROR } },
        });

        await expect(wrapped('hello', { log: mockLog })).rejects.toThrow(
          'async test error',
        );
        expect(mockLog.error).toHaveBeenCalledWith(
          'testAsyncFunction.error',
          expect.any(Object),
        );
      });
    });
  });
});
