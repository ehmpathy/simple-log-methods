import { given, then, when } from 'test-fns';

import { genContextLogTrail, withLogTrail, LogLevel } from '../../../src/index';

const maskTimestamp = (log: Record<string, unknown>) => ({
  ...log,
  timestamp: '[masked]',
});

describe('journey: lambda handler with trail', () => {
  given('[case1] lambda receives api gateway request', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    afterEach(() => consoleSpy.mockClear());
    afterAll(() => consoleSpy.mockRestore());

    // simulate event
    const event = {
      requestContext: { requestId: 'req_abc123' },
      path: '/orders',
      body: { orderId: 'ord_456' },
    };

    // step 1: create context at entry point
    const context = genContextLogTrail({
      trail: { exid: event.requestContext.requestId, stack: [] },
      env: { commit: 'a1b2c3d' },
    });

    // downstream procedure wrapped with withLogTrail
    const processRequest = withLogTrail(
      async (input: { path: string }, ctx: typeof context) => {
        ctx.log.info('parse body');
        ctx.log.info('validate request', { path: input.path });
        return { statusCode: 200 };
      },
      { name: 'processRequest' },
    );

    when('[t0] handler logs request received', () => {
      then('log includes trail.exid and env.commit', () => {
        context.log.info('request received', { path: event.path });

        const output = consoleSpy.mock.calls[0]?.[0];
        expect(maskTimestamp(output)).toMatchSnapshot();
      });
    });

    when('[t1] handler calls downstream procedure', () => {
      then('procedure logs include trail.exid in stack', async () => {
        consoleSpy.mockClear();

        await processRequest({ path: event.path }, context);

        // find the 'parse body' log
        const parseBodyLog = consoleSpy.mock.calls.find((call) =>
          call[0]?.message?.includes('parse body'),
        )?.[0];
        expect(maskTimestamp(parseBodyLog)).toMatchSnapshot();

        // find the 'validate request' log
        const validateLog = consoleSpy.mock.calls.find((call) =>
          call[0]?.message?.includes('validate request'),
        )?.[0];
        expect(maskTimestamp(validateLog)).toMatchSnapshot();
      });
    });

    when('[t2] handler logs request complete', () => {
      then('log shares same trail.exid', () => {
        consoleSpy.mockClear();

        context.log.info('request complete', { statusCode: 200 });

        const output = consoleSpy.mock.calls[0]?.[0];
        expect(maskTimestamp(output)).toMatchSnapshot();
      });
    });
  });
});
