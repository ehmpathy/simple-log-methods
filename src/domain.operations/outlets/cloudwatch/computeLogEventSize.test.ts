import { given, then, when } from 'test-fns';

import { computeLogEventSize } from './computeLogEventSize';

describe('computeLogEventSize', () => {
  given('[case1] a simple object', () => {
    when('[t0] size is computed', () => {
      then('returns JSON length plus separator', () => {
        const event = { key: 'value' };
        const result = computeLogEventSize(event);
        // +1 for array comma separator
        expect(result).toBe(JSON.stringify(event).length + 1);
        expect({ input: event, output: result }).toMatchSnapshot();
      });
    });
  });

  given('[case2] a complex nested object', () => {
    when('[t0] size is computed', () => {
      then('accounts for full serialized size', () => {
        const event = {
          level: 'INFO',
          timestamp: '2026-05-03T12:00:00.000Z',
          message: 'test message with unicode: 日本語',
          metadata: {
            nested: { deep: true },
            array: [1, 2, 3],
          },
        };
        const result = computeLogEventSize(event);
        expect(result).toBe(JSON.stringify(event).length + 1);
        expect({ input: event, output: result }).toMatchSnapshot();
      });
    });
  });

  given('[case3] an empty object', () => {
    when('[t0] size is computed', () => {
      then('returns minimal size', () => {
        const result = computeLogEventSize({});
        expect(result).toBe(3); // "{}" = 2 chars + 1 separator
        expect({ input: {}, output: result }).toMatchSnapshot();
      });
    });
  });

  given('[case4] edge cases: special values', () => {
    when('[t0] object has null value', () => {
      then('handles null correctly', () => {
        const event = { value: null };
        const result = computeLogEventSize(event);
        expect(result).toBe(JSON.stringify(event).length + 1);
        expect({ input: event, output: result }).toMatchSnapshot();
      });
    });

    when('[t1] object has empty string', () => {
      then('handles empty string correctly', () => {
        const event = { message: '' };
        const result = computeLogEventSize(event);
        expect(result).toBe(JSON.stringify(event).length + 1);
        expect({ input: event, output: result }).toMatchSnapshot();
      });
    });

    when('[t2] object has boolean values', () => {
      then('handles booleans correctly', () => {
        const event = { active: true, deleted: false };
        const result = computeLogEventSize(event);
        expect(result).toBe(JSON.stringify(event).length + 1);
        expect({ input: event, output: result }).toMatchSnapshot();
      });
    });
  });
});
