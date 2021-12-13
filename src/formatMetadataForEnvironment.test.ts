import { SupportedEnvironment } from './constants';
import { formatMetadataForEnvironment } from './formatMetadataForEnvironment';
import { identifyEnvironment } from './identifyEnvironment';

jest.mock('./identifyEnvironment');
const identifyEnvironmentMock = identifyEnvironment as jest.Mock;

describe('formatMetadataForEnvironment', () => {
  it('should json stringify the data if in the local environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.LOCAL);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const formatted = formatMetadataForEnvironment(metadata);
    expect(formatted).toEqual(JSON.stringify(metadata));
  });
  it('should do nothing with the metadata in the aws lambda environment', () => {
    identifyEnvironmentMock.mockReturnValue(SupportedEnvironment.AWS_LAMBDA);
    const metadata = { name: 'bob', likes: ['oranges', 'apples'] };
    const formatted = formatMetadataForEnvironment(metadata);
    expect(formatted).toEqual(metadata);
  });
});
