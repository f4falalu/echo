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
    .replace(/\\"/g, '"') // Convert \" to quotes
    .replace(/\\</g, '<') // Convert already escaped \< to < so we can re-escape properly
    .replace(/\\{/g, '{') // Convert already escaped \{ to {
    .replace(/\\}/g, '}'); // Convert already escaped \} to }

  // Then escape characters that MDX interprets as JSX/special syntax
  // 1. Escape < symbols that are not part of HTML tags or components
  processed = processed.replace(/<(?![a-zA-Z/]|metric\s)/g, '&lt;');

  // 2. Escape curly braces that are not JSX expressions (simple heuristic: surrounded by word boundaries or numbers)
  // This prevents {avg}, {25%}, {data} etc from being interpreted as JSX expressions
  processed = processed.replace(/{([^{}]*?)}/g, '&#123;$1&#125;');

  // 3. Escape > characters at start of line that are followed by digits (comparison operators like >500k)
  // This prevents them from being interpreted as blockquote syntax
  processed = processed.replace(/^>(\d)/gm, '&gt;$1');

  return processed;
};
