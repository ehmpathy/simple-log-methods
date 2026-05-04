import {
  CloudWatchLogsClient,
  DeleteLogGroupCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { randomUUID } from 'crypto';
import { given, then, when } from 'test-fns';

import { LogLevel } from '@src/domain.objects/constants';
import type { LogEvent } from '@src/domain.objects/LogOutlet';

import { genCloudwatchOutlet } from './genCloudwatchOutlet';

/**
 * .what = derive region for test
 * .why = provides consistent region for outlet and verification client
 * .note = credential check removed - AWS SDK credential chain will throw
 *         its own error if credentials are not available
 */
const getTestRegion = (): { region: string } => {
  const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
  return { region };
};

/**
 * .what = acceptance test for cloudwatch outlet journey
 * .why = verifies end-to-end log flow from send to cloudwatch
 */
describe('genCloudwatchOutlet.journey', () => {
  // cleanup helper
  const cleanupLogGroup = async (
    logGroupName: string,
    region: string,
  ): Promise<void> => {
    const client = new CloudWatchLogsClient({ region });
    try {
      await client.send(new DeleteLogGroupCommand({ logGroupName }));
    } catch (error) {
      // allowlist: resource not found is expected for cleanup
      if (
        error instanceof Error &&
        error.name === 'ResourceNotFoundException'
      ) {
        return;
      }
      throw error;
    }
  };

  given('[case1] cloudwatch outlet journey', () => {
    const logGroupName = `/aws/lambda/simple-log-methods-acceptance-${randomUUID()}`;
    const logStreamName = `acceptance-stream-${randomUUID()}`;
    let testRegion: string;

    afterAll(async () => {
      if (testRegion) await cleanupLogGroup(logGroupName, testRegion);
    });

    when('[t0..t5] full journey executed', () => {
      then('all logs present in order', async () => {
        const { region } = getTestRegion();
        testRegion = region;

        // [t0] outlet created → log group and stream findserted
        const outlet = genCloudwatchOutlet({
          region,
          logGroup: logGroupName,
          logStream: logStreamName,
          flushInterval: 60_000, // long interval to prevent auto-flush interference
        });

        // [t1] log messages → buffered
        const messages = [
          'journey log 1',
          'journey log 2',
          'journey log 3',
          'journey log 4',
          'journey log 5',
        ];

        for (const message of messages) {
          const event: LogEvent = {
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            message,
            metadata: { testId: randomUUID() },
          };
          outlet.send(event);
        }

        // [t2] explicit flush (since we can't easily test auto-flush in jest)
        await outlet.flush();

        // [t3] log more → new messages buffered
        const moreMessages = ['journey log 6', 'journey log 7'];

        for (const message of moreMessages) {
          const event: LogEvent = {
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            message,
            metadata: { testId: randomUUID() },
          };
          outlet.send(event);
        }

        // [t4] explicit flush (simulates exit hook behavior)
        await outlet.flush();
        outlet.close?.();

        // wait for cloudwatch to index
        await new Promise((r) => setTimeout(r, 3000));

        // [t5] verify → all logs present in order
        const client = new CloudWatchLogsClient({ region });
        const response = await client.send(
          new GetLogEventsCommand({
            logGroupName,
            logStreamName,
          }),
        );

        expect(response.events).toBeDefined();
        expect(response.events!.length).toBe(7);

        // verify order
        const loggedMessages = response.events!.map((e) => {
          const parsed = JSON.parse(e.message!);
          return parsed.message;
        });

        expect(loggedMessages).toEqual([
          'journey log 1',
          'journey log 2',
          'journey log 3',
          'journey log 4',
          'journey log 5',
          'journey log 6',
          'journey log 7',
        ]);

        // snapshot the structure
        expect(
          response.events!.map((e) => {
            const parsed = JSON.parse(e.message!);
            return {
              level: parsed.level,
              message: parsed.message,
              hasTimestamp: !!parsed.timestamp,
              hasMetadata: !!parsed.metadata,
            };
          }),
        ).toMatchSnapshot();
      });
    });
  });
});
