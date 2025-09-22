// Helper function to escape HTML entities for attribute values
export const escapeHtmlAttribute = (str: string): string => {
  return str
    .replace(/&/g, '&amp;') // Must be first to avoid double-encoding
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Helper function to unescape HTML entities
export const unescapeHtmlAttribute = (str: string): string => {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'") // Handle alternative apostrophe encoding
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // Must be last to avoid double-decoding
};

// Pre-process markdown to handle escape sequences and special characters
export const preprocessMarkdownForMdx = (markdown: string): string => {
  // First, convert literal escape sequences to actual characters
  // This handles cases where markdown is passed as a string literal with escaped characters
  let processed = markdown
    .replace(/\\n/g, '\n') // Convert \n to actual newlines
    .replace(/\\'/g, "'") // Convert \' to apostrophes
    .replace(/\\"/g, '"'); // Convert \" to quotes

  // Then escape < symbols that are not part of HTML tags or components
  // This prevents them from being interpreted as unclosed tags by the MDX parser
  // Pattern explanation:
  // - Matches < that is NOT followed by:
  //   - A letter (start of HTML tag like <div)
  //   - A slash (closing tag like </div)
  //   - An uppercase letter (React component like <Metric)
  //   - metric (our custom metric tags)
  // - But IS part of text content (has word boundary or number after it)
  processed = processed.replace(/<(?![a-zA-Z/]|metric\s)/g, '\\<');

  return processed;
};
