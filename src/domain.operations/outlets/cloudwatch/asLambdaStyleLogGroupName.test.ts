import { given, then, when } from 'test-fns';

import { asLambdaStyleLogGroupName } from './asLambdaStyleLogGroupName';

describe('asLambdaStyleLogGroupName', () => {
  given('[case1] explicit service and env.access provided', () => {
    when('[t0] called with explicit values', () => {
      then('returns /aws/lambda/{service}-{env.access}', () => {
        const result = asLambdaStyleLogGroupName({
          service: 'my-service',
          env: { access: 'prod' },
        });
        expect(result).toEqual('/aws/lambda/my-service-prod');
      });

      then('matches snapshot format', () => {
        const result = asLambdaStyleLogGroupName({
          service: 'my-service',
          env: { access: 'prod' },
        });
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case2] only service provided', () => {
    const envBefore = process.env.STAGE;

    beforeEach(() => {
      process.env.STAGE = 'test';
    });

    afterEach(() => {
      if (envBefore === undefined) {
        delete process.env.STAGE;
      } else {
        process.env.STAGE = envBefore;
      }
    });

    when('[t0] called with service only', () => {
      then('infers env.access from env var', () => {
        const result = asLambdaStyleLogGroupName({
          service: 'my-service',
        });
        expect(result).toEqual('/aws/lambda/my-service-test');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case3] only env.access provided', () => {
    when('[t0] called with env.access only', () => {
      then('infers service from package.json', () => {
        const result = asLambdaStyleLogGroupName({
          env: { access: 'prep' },
        });
        // package.json name is 'sdk-logs'
        expect(result).toEqual('/aws/lambda/sdk-logs-prep');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case4] no args provided', () => {
    const envBefore = process.env.STAGE;

    beforeEach(() => {
      process.env.STAGE = 'local';
    });

    afterEach(() => {
      if (envBefore === undefined) {
        delete process.env.STAGE;
      } else {
        process.env.STAGE = envBefore;
      }
    });

    when('[t0] called with no args', () => {
      then('infers both from package.json and env var', () => {
        const result = asLambdaStyleLogGroupName();
        expect(result).toEqual('/aws/lambda/sdk-logs-local');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case5] edge cases: special service names', () => {
    when('[t0] service has multiple dashes', () => {
      then('preserves dashes in output', () => {
        const result = asLambdaStyleLogGroupName({
          service: 'my-complex-service-name',
          env: { access: 'prod' },
        });
        expect(result).toEqual('/aws/lambda/my-complex-service-name-prod');
        expect(result).toMatchSnapshot();
      });
    });

    when('[t1] service has underscores', () => {
      then('preserves underscores in output', () => {
        const result = asLambdaStyleLogGroupName({
          service: 'my_service',
          env: { access: 'test' },
        });
        expect(result).toEqual('/aws/lambda/my_service-test');
        expect(result).toMatchSnapshot();
      });
    });

    when('[t2] env.access is empty string and STAGE not set', () => {
      const envBefore = process.env.STAGE;

      beforeAll(() => {
        delete process.env.STAGE;
      });

      afterAll(() => {
        if (envBefore !== undefined) {
          process.env.STAGE = envBefore;
        }
      });

      then('falls back to default env', () => {
        const result = asLambdaStyleLogGroupName({
          service: 'test-svc',
        });
        // without STAGE, should use NODE_ENV or 'local'
        expect(result).toMatch(/^\/aws\/lambda\/test-svc-\w+$/);
        expect({
          prefix: '/aws/lambda/',
          hasService: result.includes('test-svc'),
          hasEnv: result.split('-').length > 2,
        }).toMatchSnapshot();
      });
    });
  });
});
