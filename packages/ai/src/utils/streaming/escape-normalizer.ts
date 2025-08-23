/**
 * Utility to normalize escaped characters in streaming text
 * Prevents double-escaping issues during chunk processing
 */

/**
 * Detects if a string contains double-escaped characters
 * (Internal helper function)
 */
function hasDoubleEscaping(text: string): boolean {
  // Check for common double-escaped patterns including backslashes
  return /\\\\[ntr"]|\\\\\\\\/.test(text);
}

/**
 * Normalizes double-escaped characters to single escaping
 * Only processes if double-escaping is detected to avoid unnecessary processing
 */
export function normalizeEscapedText(text: string): string {
  // Quick check - if no double escaping, return as-is
  if (!hasDoubleEscaping(text)) {
    return text;
  }

  // Replace double-escaped characters with single escaping
  const result = text
    .replace(/\\\\n/g, '\n') // \\n -> \n
    .replace(/\\\\t/g, '\t') // \\t -> \t
    .replace(/\\\\r/g, '\r') // \\r -> \r
    .replace(/\\\\"/g, '"') // \\" -> "
    .replace(/\\\\\\\\/g, '\\\\'); // \\\\ -> \\ (4 backslashes to 2)

  return result;
}

/**
 * Unescapes JSON string escape sequences to their actual characters
 * This is needed when extracting raw values from incomplete JSON during streaming
 */
export function unescapeJsonString(text: string): string {
  // Replace JSON escape sequences with their actual characters
  // Process in specific order to handle escape sequences correctly
  let result = text;

  // Use a unique placeholder for escaped backslashes
  const BACKSLASH_PLACEHOLDER = '__ESCAPED_BACKSLASH__';

  // First replace escaped backslashes to avoid interfering with other sequences
  result = result.replace(/\\\\/g, BACKSLASH_PLACEHOLDER);

  // Then replace other escape sequences
  result = result.replace(/\\n/g, '\n'); // \n -> newline
  result = result.replace(/\\r/g, '\r'); // \r -> carriage return
  result = result.replace(/\\t/g, '\t'); // \t -> tab
  result = result.replace(/\\"/g, '"'); // \" -> "

  // Finally replace the placeholder with actual backslash
  result = result.replace(new RegExp(BACKSLASH_PLACEHOLDER, 'g'), '\\');

  return result;
}
