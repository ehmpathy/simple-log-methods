import { genLogMethods } from './genLogMethods';

describe('genLogMethods', () => {
  it('should create the log methods', () => {
    const log = genLogMethods();
    expect(log).toHaveProperty('error');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('debug');
  });
});
