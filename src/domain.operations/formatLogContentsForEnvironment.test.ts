import { SupportedEnvironment } from '@src/domain.objects/constants';

import { LogLevel } from '..';
import { formatLogContentsForEnvironment } from './formatLogContentsForEnvironment';
import { identifyEnvironment } from './identifyEnvironment';

jest.mock('./identifyEnvironment');
const identifyEnvironmentMock = identifyEnvironment as jest.Mock;

describe('formatMetadataForEnvironment', () => {
  it('should not stringify the contents - but should stringify the metadata - if in the local environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
      metadata,
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toEqual({
      ...logContents,
      metadata: JSON.stringify(metadata),
    });
  });
  it('should stringify the contents in the aws lambda environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.AWS_LAMBDA);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
      metadata,
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toEqual(JSON.stringify(logContents));
  });
  it('should not stringify the contents nor the metadata if in web browser environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.WEB_BROWSER);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
      metadata,
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toEqual(logContents);
  });
  it('should include trail in output when provided', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
      trail: { exid: 'req_123', stack: ['processOrder'] },
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toMatchObject({
      trail: { exid: 'req_123', stack: ['processOrder'] },
    });
  });
  it('should include env in output when commit is not null', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
      env: { commit: 'a1b2c3d' },
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toMatchObject({
      env: { commit: 'a1b2c3d' },
    });
  });
  it('should omit trail from output when not provided', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).not.toHaveProperty('trail');
  });
  it('should omit env from output when not provided', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).not.toHaveProperty('env');
  });
  it('should omit exid from trail when exid is null', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const logContents = {
      level: LogLevel.INFO,
      timestamp: new Date().toISOString(),
      message: 'hello world!',
      trail: { exid: null, stack: ['processOrder'] },
    };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toMatchObject({
      trail: { stack: ['processOrder'] },
    });
    expect((formatted as any).trail).not.toHaveProperty('exid');
  });
});
