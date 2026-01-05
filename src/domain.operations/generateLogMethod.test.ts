import { LogLevel } from '@src/domain.objects/constants';

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
  });
  it('should generate a method that outputs to console.warn if at or above warn level', () => {
    const spy = jest.spyOn(console, 'warn');
    const logError = generateLogMethod({
      level: LogLevel.ERROR,
      minimalLogLevel: LogLevel.DEBUG,
    });
    logError('testMessage');
    expect(spy).toHaveBeenCalledTimes(1);
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
  });
  it('should not output anything if level is below minimum', () => {
    const spy = jest.spyOn(console, 'log');
    const logDebug = generateLogMethod({
      level: LogLevel.DEBUG,
      minimalLogLevel: LogLevel.WARN,
    });
    logDebug('testMessage');
    expect(spy).not.toHaveBeenCalled();
  });
});
