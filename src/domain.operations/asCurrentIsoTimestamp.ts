/**
 * .what = returns current UTC timestamp in ISO 8601 format
 * .why = extracts decode-friction from orchestrators
 */
export const asCurrentIsoTimestamp = (): string => {
  return new Date().toISOString();
};
