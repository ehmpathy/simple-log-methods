import type { Environment } from 'sdk-environment';

import type { LogLevel } from './constants';

/**
 * .what = a log event that flows through outlets
 * .why = standardized shape for log data across destinations
 */
export interface LogEvent {
  level: LogLevel;
  timestamp: string;
  message: string;
  metadata?: Record<string, unknown>;
  env?: Partial<Environment>;
}

/**
 * .what = an outlet that receives log events
 * .why = enables logs to route to external destinations (e.g., CloudWatch)
 */
export interface LogOutlet {
  /**
   * .what = send a log event to this outlet
   * .why = buffers or dispatches the event to the destination
   */
  send: (event: LogEvent) => void;

  /**
   * .what = flush buffered events to the destination
   * .why = ensures all buffered logs are sent before process exit
   */
  flush: () => Promise<void>;

  /**
   * .what = close the outlet and release resources
   * .why = cleans up timers and process listeners to prevent leaks in tests
   * .note = optional - not all outlets require cleanup
   */
  close?: () => void;
}
