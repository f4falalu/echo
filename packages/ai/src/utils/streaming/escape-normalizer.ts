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
