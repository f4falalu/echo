/**
 * Trims additional text by removing everything after first newline and limiting to 150 characters
 * without cutting off words
 * @param text - The text to trim
 * @returns The trimmed text
 */
function trimAdditionalText(text: string): string {
  if (!text) {
    return '';
  }

  // Remove everything after the first newline
  let trimmedText = text.split('\n')[0] || '';

  // If still longer than 150 characters, trim to 150 but don't cut off words
  if (trimmedText.length > 150) {
    const truncated = trimmedText.substring(0, 150);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    trimmedText = lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;

    // Add ellipsis if the text doesn't end with punctuation
    const punctuationRegex = /[.!?;:]$/;
    if (!punctuationRegex.test(trimmedText)) {
      trimmedText += '...';
    }
  }

  return trimmedText;
}

/**
 * Highlights search terms in text by wrapping matching words with HTML <b> tags
 * @param searchString - The search query string
 * @param text - The text to highlight terms in
 * @returns The text with search terms wrapped in <b> tags
 */
function highlightSearchTerms(searchString: string, text: string): string {
  if (!searchString || !text) {
    return text;
  }

  // Split search string by spaces and filter out empty strings
  const searchTerms = searchString.split(' ').filter((term) => term.trim().length > 0);

  if (searchTerms.length === 0) {
    return text;
  }

  let result = text;

  // Process each search term individually to ensure all matches are replaced
  searchTerms.forEach((term) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length === 0) return;

    const escapedTerm = trimmedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create regex with global flag to replace ALL occurrences
    const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');

    // Replace all matches for this term
    result = result.replace(regex, '<b>$1</b>');
  });

  return result;
}

/**
 * Processes search results by trimming additional text and highlighting search terms
 * @param searchQuery - The search query string
 * @param title - The title text to highlight
 * @param additionalText - The additional text to trim and highlight
 * @returns Object containing processed title and additional text
 */
export function processSearchResultText(
  searchQuery: string,
  title: string,
  additionalText: string
): { processedTitle: string; processedAdditionalText: string } {
  // Trim the additional text first
  const trimmedAdditionalText = trimAdditionalText(additionalText);

  // Highlight search terms in both title and trimmed additional text
  const processedTitle = highlightSearchTerms(searchQuery, title);
  const processedAdditionalText = highlightSearchTerms(searchQuery, trimmedAdditionalText);

  return {
    processedTitle,
    processedAdditionalText,
  };
}
