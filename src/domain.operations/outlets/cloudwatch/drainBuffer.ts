import type { LogEvent } from '@src/domain.objects/LogOutlet';

/**
 * .what = extracts all events from buffer and clears it
 * .why = extracts decode-friction from orchestrator (splice atomically removes and returns)
 */
export const drainBuffer = (buffer: LogEvent[]): LogEvent[] => {
  return buffer.splice(0, buffer.length);
};
