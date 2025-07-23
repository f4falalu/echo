// Helper functions for inline code detection in streaming markdown

import type { LLMOutputMatcher } from '@llm-ui/react';

/**
 * Finds complete inline code blocks (text between single backticks)
 * @returns A function that finds complete inline code in the input
 */
export const findCompleteInlineCode = (): LLMOutputMatcher => {
  return (input: string) => {
    // Match inline code that is NOT part of a code block (```).
    // Look for single backticks that are not preceded or followed by additional backticks
    const regex = /(?<!`)`(?!``)[^`\n]+`(?!`)/;
    const match = regex.exec(input);

    if (match && match.index !== undefined) {
      return {
        startIndex: match.index,
        endIndex: match.index + 1,
        outputRaw: match[0]
      };
    }

    return undefined;
  };
};

/**
 * Finds partial inline code blocks (unclosed inline code)
 * @returns A function that finds partial inline code in the input
 */
export function findPartialInlineCode(
  text: string
): { startIndex: number; endIndex: number; outputRaw: string } | null {
  // Find all single backticks (not part of code blocks)
  const backticks: number[] = [];

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && text[i - 1] !== '`' && text[i + 1] !== '`') {
      backticks.push(i);
    }
  }

  // If odd number of backticks, the last one is unclosed
  if (backticks.length % 2 === 1) {
    const startIndex = backticks[backticks.length - 1];
    return {
      startIndex,
      endIndex: text.length,
      outputRaw: text.substring(startIndex)
    };
  }

  return null;
}
