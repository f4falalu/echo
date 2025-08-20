/**
 * Ensures timeFrame values are properly quoted in YAML content
 * Finds timeFrame: value and wraps the value in quotes if not already quoted
 */
export function ensureTimeFrameQuoted(ymlContent: string): string {
  // Regex to match timeFrame field with its value
  // Captures: timeFrame + whitespace + : + whitespace + value (until end of line)
  const timeFrameRegex = /(timeFrame\s*:\s*)([^\r\n]+)/g;

  return ymlContent.replace(timeFrameRegex, (match, prefix, value) => {
    // Trim whitespace from the value
    const trimmedValue = value.trim();

    // Check if value is already properly quoted (starts and ends with same quote type)
    const isAlreadyQuoted =
      (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"));

    if (isAlreadyQuoted) {
      // Already quoted, return as is
      return match;
    }

    // Not quoted, wrap in double quotes
    return `${prefix}"${trimmedValue}"`;
  });
}
