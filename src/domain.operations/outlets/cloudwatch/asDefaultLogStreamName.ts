import { randomUUID } from 'crypto';

/**
 * .what = extracts date in Lambda log stream format (YYYY/MM/DD)
 * .why = matches Lambda's native log stream date format
 */
const asLambdaDatePrefix = (input: { from: Date }): string => {
  const iso = input.from.toISOString().split('T')[0]!;
  return iso.replace(/-/g, '/'); // YYYY-MM-DD -> YYYY/MM/DD
};

/**
 * .what = generates a default log stream name for CloudWatch
 * .why = matches Lambda's log stream format: YYYY/MM/DD/[$LATEST]instance-id
 * .note = explicit opt-in: user adds outlet only when automatic forwarder absent
 */
export const asDefaultLogStreamName = (): string => {
  const datePrefix = asLambdaDatePrefix({ from: new Date() });
  const instanceId = randomUUID();
  return `${datePrefix}/[$LATEST]${instanceId}`;
};
