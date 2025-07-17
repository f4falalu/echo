import { describe, expect, it } from 'vitest';
import { convertMarkdownToSlack } from './markdownToSlack';

describe('convertMarkdownToSlack', () => {
  it('should handle empty or invalid input', () => {
    expect(convertMarkdownToSlack('')).toEqual({ text: '' });
    expect(convertMarkdownToSlack(null as any)).toEqual({ text: '' });
    expect(convertMarkdownToSlack(undefined as any)).toEqual({ text: '' });
  });

  it('should convert headers to section blocks', () => {
    const markdown = '# Main Title\n## Subtitle\nSome content';
    const result = convertMarkdownToSlack(markdown);

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks?.[0]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Main Title*',
      },
    });
    expect(result.blocks?.[1]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Subtitle*',
      },
    });
    expect(result.blocks?.[2]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Some content',
      },
    });
  });

  it('should convert bold text', () => {
    const markdown = 'This is **bold** and this is __also bold__';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('This is *bold* and this is *also bold*');
  });

  it('should convert italic text', () => {
    const markdown = 'This is *italic* and this is _also italic_';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('This is _italic_ and this is _also italic_');
  });

  it('should handle inline code', () => {
    const markdown = 'Use `console.log()` to debug';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Use `console.log()` to debug');
  });

  it('should handle code blocks', () => {
    const markdown = '```javascript\nconsole.log("hello");\n```';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('```javascript\nconsole.log("hello");\n```');
  });

  it('should handle code blocks without language', () => {
    const markdown = '```\nsome code\n```';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('```\nsome code\n```');
  });

  it('should convert unordered lists', () => {
    const markdown = '- Item 1\n* Item 2\n+ Item 3';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('• Item 1\n• Item 2\n• Item 3');
  });

  it('should convert ordered lists', () => {
    const markdown = '1. First item\n2. Second item\n3. Third item';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('1. First item\n2. Second item\n3. Third item');
  });

  it('should handle mixed formatting', () => {
    const markdown = '# Title\nThis is **bold** and *italic* with `code`\n- List item';
    const result = convertMarkdownToSlack(markdown);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks?.[0]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Title*',
      },
    });
    expect(result.blocks?.[1]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'This is *bold* and _italic_ with `code`\n• List item',
      },
    });
  });

  it('should handle text without complex formatting', () => {
    const markdown = 'Simple text with **bold** and *italic*';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Simple text with *bold* and _italic_');
    expect(result.blocks).toBeUndefined();
  });

  it('should clean up extra whitespace', () => {
    const markdown = 'Text with\n\n\n\nmultiple newlines';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Text with\n\nmultiple newlines');
  });

  it('should handle nested formatting correctly', () => {
    const markdown = '**This is bold with *italic* inside**';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('*This is bold with _italic_ inside*');
  });

  it('should preserve unsupported markdown unchanged', () => {
    const markdown = 'Text with [link](http://example.com) and ![image](image.png)';
    const result = convertMarkdownToSlack(markdown);

    expect(result.text).toBe('Text with [link](http://example.com) and ![image](image.png)');
  });
});
