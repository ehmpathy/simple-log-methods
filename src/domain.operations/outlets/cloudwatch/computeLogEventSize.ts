/**
 * .what = computes the serialized size of a log event
 * .why = enables amortized O(1) buffer size checks via incremental sum
 *
 * .note = this function is O(n) where n = serialized size.
 *         call once per send() and track sum to avoid full buffer re-serialize.
 */
export const computeLogEventSize = (event: object): number => {
  return JSON.stringify(event).length + 1; // +1 for array comma separator
};
