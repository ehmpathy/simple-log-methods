import { given, then, when } from 'test-fns';

import { asCurrentIsoTimestamp } from './asCurrentIsoTimestamp';

describe('asCurrentIsoTimestamp', () => {
  given('[case1] timestamp is requested', () => {
    when('[t0] called', () => {
      then('returns ISO 8601 format', () => {
        const result = asCurrentIsoTimestamp();
        // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        // snapshot structure (value is non-deterministic)
        expect({
          matchesIso8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
            result,
          ),
          length: result.length,
          endsWithZ: result.endsWith('Z'),
        }).toMatchSnapshot();
      });

      then('timestamp is parseable', () => {
        const result = asCurrentIsoTimestamp();
        const parsed = Date.parse(result);
        expect(parsed).not.toBeNaN();
        expect({ isParseable: !isNaN(parsed) }).toMatchSnapshot();
      });

      then('timestamp is close to current time', () => {
        const before = Date.now();
        const result = asCurrentIsoTimestamp();
        const after = Date.now();

        const parsed = Date.parse(result);
        expect(parsed).toBeGreaterThanOrEqual(before);
        expect(parsed).toBeLessThanOrEqual(after);
        expect({
          isWithinRange: parsed >= before && parsed <= after,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case2] edge cases: multiple calls', () => {
    when('[t0] called multiple times rapidly', () => {
      then('each call returns valid distinct or equal timestamps', () => {
        const results = [
          asCurrentIsoTimestamp(),
          asCurrentIsoTimestamp(),
          asCurrentIsoTimestamp(),
        ];

        // all should match ISO format
        results.forEach((r) => {
          expect(r).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        // snapshot the structure check (values are non-deterministic)
        expect({
          allValid: results.every((r) =>
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r),
          ),
          count: results.length,
        }).toMatchSnapshot();
      });
    });
  });
});
