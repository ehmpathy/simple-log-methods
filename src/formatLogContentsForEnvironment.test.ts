import { LogLevel } from '.';
import { SupportedEnvironment } from './constants';
import { formatLogContentsForEnvironment } from './formatLogContentsForEnvironment';
import { identifyEnvironment } from './identifyEnvironment';

jest.mock('./identifyEnvironment');
const identifyEnvironmentMock = identifyEnvironment as jest.Mock;

describe('formatMetadataForEnvironment', () => {
  it('should not stringify the contents - but should stringify the metadata - if in the local environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const logContents = { level: LogLevel.INFO, timestamp: new Date().toISOString(), message: 'hello world!', metadata };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toEqual({ ...logContents, metadata: JSON.stringify(metadata) });
  });
  it('should stringify the contents in the aws lambda environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.AWS_LAMBDA);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const logContents = { level: LogLevel.INFO, timestamp: new Date().toISOString(), message: 'hello world!', metadata };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toEqual(JSON.stringify(logContents));
  });
  it('should not stringify the contents nor the metadata if in web browser environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.WEB_BROWSER);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const logContents = { level: LogLevel.INFO, timestamp: new Date().toISOString(), message: 'hello world!', metadata };
    const formatted = formatLogContentsForEnvironment(logContents);
    expect(formatted).toEqual(logContents);
  });
});
