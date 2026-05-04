import { given, then, when } from 'test-fns';

import { asDefaultLogStreamName } from './asDefaultLogStreamName';

describe('asDefaultLogStreamName', () => {
  given('[case1] a call to generate log stream name', () => {
    when('[t0] a stream name is generated', () => {
      then('it should return lambda-style stream name', () => {
        const result = asDefaultLogStreamName();

        // verify format: YYYY/MM/DD/[$LATEST]uuid (Lambda style)
        expect(result).toMatch(
          /^\d{4}\/\d{2}\/\d{2}\/\[\$LATEST\][0-9a-f-]{36}$/,
        );
      });

      then('it should use current date as prefix', () => {
        const result = asDefaultLogStreamName();
        const parts = result.split('/');
        const datePrefix = `${parts[0]}/${parts[1]}/${parts[2]}`;

        // verify date prefix matches today (convert ISO to slash format)
        const today = new Date()
          .toISOString()
          .split('T')[0]!
          .replace(/-/g, '/');
        expect(datePrefix).toEqual(today);
      });

      then('it should generate unique names on each call', () => {
        const first = asDefaultLogStreamName();
        const second = asDefaultLogStreamName();

        expect(first).not.toEqual(second);
      });

      then('it should match snapshot format', () => {
        const result = asDefaultLogStreamName();

        // snapshot structure (uuid redacted for determinism)
        expect({
          hasDatePrefix: /^\d{4}\/\d{2}\/\d{2}/.test(result),
          hasVersionPrefix: result.includes('[$LATEST]'),
          hasUuidSuffix: /[0-9a-f-]{36}$/.test(result),
          parts: result.split('/').length,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case2] edge case: format consistency', () => {
    when('[t0] multiple names generated', () => {
      then('all match expected format structure', () => {
        const names = Array.from({ length: 5 }, () => asDefaultLogStreamName());

        // verify all match format
        const allMatch = names.every((name) =>
          /^\d{4}\/\d{2}\/\d{2}\/\[\$LATEST\][0-9a-f-]{36}$/.test(name),
        );
        expect(allMatch).toBe(true);

        // verify all are unique
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);

        expect({
          allMatchFormat: allMatch,
          allUnique: uniqueNames.size === names.length,
          count: names.length,
        }).toMatchSnapshot();
      });
    });
  });
});
