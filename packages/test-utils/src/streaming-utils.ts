/**
 * Streaming test utilities for handling AsyncIterable values in tests
 */

/**
 * Helper to handle tools that may return a value or an AsyncIterable of values.
 * For AsyncIterable values, it materializes the stream by consuming all chunks
 * and returning the last one.
 *
 * @param value - The value to materialize, either a direct value or an AsyncIterable
 * @returns Promise resolving to the materialized value
 * @throws Error if the stream yields no values
 */
export async function materialize<T>(value: T | AsyncIterable<T>): Promise<T> {
  // biome-ignore lint/suspicious/noExplicitAny: we are ignoring this for now
  const asyncIterator = (value as any)?.[Symbol.asyncIterator];
  if (typeof asyncIterator === 'function') {
    let lastChunk: T | undefined;
    for await (const chunk of value as AsyncIterable<T>) {
      lastChunk = chunk;
    }
    if (lastChunk === undefined) throw new Error('Stream yielded no values');
    return lastChunk;
  }
  return value as T;
}
