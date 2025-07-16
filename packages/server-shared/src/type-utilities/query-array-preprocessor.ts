import { z } from 'zod';

/**
 * The core preprocessing logic for converting query parameters into arrays
 */
const queryArrayPreprocessFn = (val: unknown) => {
  // Handle no value
  if (!val) return undefined;

  // Already an array, pass through
  if (Array.isArray(val)) return val;

  // Handle string input (single or comma-separated)
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  // Single value case (wrap in array)
  return [val];
};

/**
 * Creates a preprocessor that converts query parameter strings into arrays.
 * Handles various input formats:
 * - Single value: "admin" → ["admin"]
 * - Comma-separated: "admin,member" → ["admin", "member"]
 * - Already an array: ["admin", "member"] → ["admin", "member"]
 * - No value: undefined → undefined
 */
export const createQueryArrayPreprocessor = <T>(schema: z.ZodArray<z.ZodType<T>>) => {
  return z.preprocess(queryArrayPreprocessFn, schema);
};

/**
 * Type-safe helper for creating optional query array preprocessors
 */
export const createOptionalQueryArrayPreprocessor = <T>(itemSchema: z.ZodType<T>) => {
  return z.preprocess(queryArrayPreprocessFn, z.array(itemSchema).optional());
};
