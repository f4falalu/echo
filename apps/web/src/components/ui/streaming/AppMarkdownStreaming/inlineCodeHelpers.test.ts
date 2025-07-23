import { describe, it, expect } from 'vitest';
import { findPartialInlineCode } from './inlineCodeHelpers';

describe('findPartialInlineCode', () => {
  it('should find partial inline code (unclosed backtick)', () => {
    // Test case: Text with an unclosed backtick at the end
    const text = 'This is some text with `unclosed code';
    const result = findPartialInlineCode(text);

    expect(result).not.toBeNull();
    expect(result).toEqual({
      startIndex: 23, // Position of the backtick
      endIndex: 37, // End of the partial code
      outputRaw: '`unclosed code'
    });
  });

  it('should return null for complete inline code', () => {
    // Test case: Text with properly closed inline code
    const text = 'This is some text with `complete code` here';
    const result = findPartialInlineCode(text);

    // Should return null because the code block is complete (properly closed)
    expect(result).toBeNull();
  });

  it('should return null when no inline code is present', () => {
    // Test case: Text with no backticks at all
    const text = 'This is just plain text without any code blocks';
    const result = findPartialInlineCode(text);

    // Should return null because there are no backticks
    expect(result).toBeNull();
  });
});
