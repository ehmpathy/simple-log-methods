import { given, then, when } from 'test-fns';

import { genContextLogTrail, withLogTrail } from '../../../src/index';

const maskTimestamp = (log: Record<string, unknown>) => ({
  ...log,
  timestamp: '[masked]',
});

describe('journey: multi-service trail propagation', () => {
  given('[case1] service A invokes service B', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    afterEach(() => consoleSpy.mockClear());
    afterAll(() => consoleSpy.mockRestore());

    // service A entry point
    const eventA = {
      requestContext: { requestId: 'req_abc123' },
      orderId: 'ord_456',
    };

    const contextA = genContextLogTrail({
      trail: { exid: eventA.requestContext.requestId, stack: [] },
      env: { commit: 'svc-a-commit' },
    });

    // service A procedure
    const processOrder = withLogTrail(
      async (input: { orderId: string }, ctx: typeof contextA) => {
        ctx.log.info('process order', { orderId: input.orderId });
        return { success: true };
      },
      { name: 'processOrder' },
    );

    when('[t0] service A logs at entry', () => {
      then('log has trail.exid with empty stack', () => {
        contextA.log.info('service A received request');

        const output = consoleSpy.mock.calls[0]?.[0];
        expect(maskTimestamp(output)).toMatchSnapshot();
      });
    });

    when('[t1] service A calls wrapped procedure', () => {
      then('procedure log has procedure name in stack', async () => {
        consoleSpy.mockClear();

        await processOrder({ orderId: eventA.orderId }, contextA);

        const orderLog = consoleSpy.mock.calls.find((call) =>
          call[0]?.message?.includes('process order'),
        )?.[0];
        expect(maskTimestamp(orderLog)).toMatchSnapshot();
      });
    });

    when('[t2] service A serializes trail for service B', () => {
      then('trail state is accessible', () => {
        const trailState = contextA.log.trail;
        expect(trailState).toMatchSnapshot();
      });
    });

    when('[t3] service B receives trail and creates context', () => {
      then('service B logs share same exid with inherited stack', () => {
        consoleSpy.mockClear();

        // simulate trail passed from inside service A's processOrder procedure
        // (service A grabbed ctx.log.trail from inside the wrapped procedure)
        const trailFromA = {
          exid: 'req_abc123',
          stack: ['processOrder'], // stack from inside service A procedure
        };

        const contextB = genContextLogTrail({
          trail: trailFromA,
          env: { commit: 'svc-b-commit' },
        });

        contextB.log.info('service B received request');

        const output = consoleSpy.mock.calls[0]?.[0];
        expect(maskTimestamp(output)).toMatchSnapshot();
      });
    });

    when('[t4] service B calls its own wrapped procedure', () => {
      then('stack shows cross-service path', async () => {
        consoleSpy.mockClear();

        // simulate trail passed from inside service A's processOrder procedure
        const trailFromA = {
          exid: 'req_abc123',
          stack: ['processOrder'],
        };

        const contextB = genContextLogTrail({
          trail: trailFromA,
          env: { commit: 'svc-b-commit' },
        });

        const chargePayment = withLogTrail(
          async (input: { orderId: string }, ctx: typeof contextB) => {
            ctx.log.info('charge card', { orderId: input.orderId });
            return { charged: true };
          },
          { name: 'chargePayment' },
        );

        await chargePayment({ orderId: eventA.orderId }, contextB);

        const chargeLog = consoleSpy.mock.calls.find((call) =>
          call[0]?.message?.includes('charge card'),
        )?.[0];
        expect(maskTimestamp(chargeLog)).toMatchSnapshot();
      });
    });

    when('[t5] service B logs completion', () => {
      then('log shares same exid as service A', () => {
        consoleSpy.mockClear();

        // simulate trail passed from inside service A's processOrder procedure
        const trailFromA = {
          exid: 'req_abc123',
          stack: ['processOrder'],
        };

        const contextB = genContextLogTrail({
          trail: trailFromA,
          env: { commit: 'svc-b-commit' },
        });

        contextB.log.info('service B complete');

        const output = consoleSpy.mock.calls[0]?.[0];
        expect(maskTimestamp(output)).toMatchSnapshot();
      });
    });

    when('[t6] service A logs completion after service B returns', () => {
      then('log shares same exid with empty stack', () => {
        consoleSpy.mockClear();

        contextA.log.info('service A complete');

        const output = consoleSpy.mock.calls[0]?.[0];
        expect(maskTimestamp(output)).toMatchSnapshot();
      });
    });
  });
});
