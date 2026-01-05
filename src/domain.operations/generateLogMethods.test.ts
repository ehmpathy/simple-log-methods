import { generateLogMethods } from './generateLogMethods';

describe('generateLogMethods', () => {
  it('should create the log methods', () => {
    const log = generateLogMethods();
    expect(log).toHaveProperty('error');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('debug');
  });
});
