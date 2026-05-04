import { getError, given, then, when } from 'test-fns';

import { assertAwsCredentialsPresent } from './assertAwsCredentialsPresent';

describe('assertAwsCredentialsPresent', () => {
  const envBefore = { ...process.env };

  afterEach(() => {
    // restore env
    process.env = { ...envBefore };
  });

  given('[case1] no AWS credentials configured', () => {
    when('[t0] assertion is called', () => {
      then('it throws BadRequestError with guidance', async () => {
        // clear all AWS credential sources
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_PROFILE;
        delete process.env.AWS_ROLE_ARN;
        delete process.env.AWS_WEB_IDENTITY_TOKEN_FILE;
        delete process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
        delete process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
        delete process.env.AWS_EXECUTION_ENV;

        const error = await getError(() => assertAwsCredentialsPresent());
        expect(error).toBeDefined();
        expect(error.message).toContain('AWS credentials not configured');
        expect({ errorMessage: error.message }).toMatchSnapshot();
      });
    });
  });

  given('[case2] env var credentials are configured', () => {
    when('[t0] assertion is called', () => {
      then('it does not throw', () => {
        process.env.AWS_ACCESS_KEY_ID = 'test-key';
        process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

        expect(() => assertAwsCredentialsPresent()).not.toThrow();
        expect({
          throws: false,
          credentialSource: 'env-vars',
        }).toMatchSnapshot();
      });
    });
  });

  given('[case3] AWS profile is configured', () => {
    when('[t0] assertion is called', () => {
      then('it does not throw', () => {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        process.env.AWS_PROFILE = 'test-profile';

        expect(() => assertAwsCredentialsPresent()).not.toThrow();
        expect({
          throws: false,
          credentialSource: 'profile',
        }).toMatchSnapshot();
      });
    });
  });

  given('[case4] execution env is configured (Lambda/EC2)', () => {
    when('[t0] assertion is called', () => {
      then('it does not throw', () => {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_PROFILE;
        process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x';

        expect(() => assertAwsCredentialsPresent()).not.toThrow();
        expect({
          throws: false,
          credentialSource: 'execution-env',
        }).toMatchSnapshot();
      });
    });
  });

  given('[case5] container credentials are configured (ECS)', () => {
    when('[t0] assertion is called', () => {
      then('it does not throw', () => {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_PROFILE;
        delete process.env.AWS_EXECUTION_ENV;
        process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI =
          '/v2/credentials/abc123';

        expect(() => assertAwsCredentialsPresent()).not.toThrow();
        expect({
          throws: false,
          credentialSource: 'container-credentials',
        }).toMatchSnapshot();
      });
    });
  });

  given('[case6] web identity credentials are configured (EKS)', () => {
    when('[t0] assertion is called', () => {
      then('it does not throw', () => {
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_PROFILE;
        delete process.env.AWS_EXECUTION_ENV;
        delete process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
        process.env.AWS_WEB_IDENTITY_TOKEN_FILE = '/var/run/secrets/token';
        process.env.AWS_ROLE_ARN = 'arn:aws:iam::123456789:role/test-role';

        expect(() => assertAwsCredentialsPresent()).not.toThrow();
        expect({
          throws: false,
          credentialSource: 'web-identity',
        }).toMatchSnapshot();
      });
    });
  });
});
