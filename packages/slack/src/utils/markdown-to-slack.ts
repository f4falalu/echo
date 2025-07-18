import type { SlackBlock } from '../types/blocks';

export interface MarkdownConversionResult {
  text: string;
  blocks?: SlackBlock[];
}

export function convertMarkdownToSlack(markdown: string): MarkdownConversionResult {
  if (!markdown || typeof markdown !== 'string') {
    return { text: markdown || '' };
  }

  const blocks: SlackBlock[] = [];
  let hasComplexFormatting = false;

  // Split the content into lines to process sequentially
  const lines = markdown.split('\n');
  let currentSection: string[] = [];

  // Helper function to process inline formatting
  function processInlineFormatting(text: string): string {
    let processedText = text;

    // Handle code blocks first to prevent interference
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    processedText = processedText.replace(codeBlockRegex, (_match, language, code) => {
      return `\`\`\`${language || ''}\n${code.trim()}\n\`\`\``;
    });

    // Handle inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    processedText = processedText.replace(inlineCodeRegex, '`$1`');

    // Handle bold text with placeholder technique
    const boldPlaceholder = '___BOLD_PLACEHOLDER___';
    const boldMatches: Array<{ placeholder: string; replacement: string }> = [];
    let boldCounter = 0;

    const boldRegex = /(\*\*|__)(.*?)\1/g;
    processedText = processedText.replace(boldRegex, (_match, _delimiter, content) => {
      const placeholder = `${boldPlaceholder}${boldCounter}${boldPlaceholder}`;
      const processedContent = content
        .replace(/\*([^*]+)\*/g, '_$1_')
        .replace(/_([^_]+)_/g, '_$1_');
      boldMatches.push({ placeholder, replacement: `*${processedContent}*` });
      boldCounter++;
      return placeholder;
    });

    // Handle italic text
    const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;
    processedText = processedText.replace(italicRegex, (_match, group1, group2) => {
      const content = group1 || group2;
      return `_${content}_`;
    });

    // Restore bold text
    for (const { placeholder, replacement } of boldMatches) {
      processedText = processedText.replace(placeholder, replacement);
    }

    return processedText;
  }

  // Helper function to add current section as a block
  function flushCurrentSection() {
    if (currentSection.length > 0) {
      let sectionText = currentSection.join('\n').trim();

      // Process inline formatting
      sectionText = processInlineFormatting(sectionText);

      // Process lists
      const unorderedListRegex = /^[\s]*[-*+]\s+(.+)$/gm;
      sectionText = sectionText.replace(unorderedListRegex, '• $1');

      const orderedListRegex = /^[\s]*\d+\.\s+(.+)$/gm;
      let listCounter = 1;
      sectionText = sectionText.replace(orderedListRegex, (_match, content) => {
        return `${listCounter++}. ${content}`;
      });

      if (sectionText) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: sectionText,
          },
        });
      }
      currentSection = [];
    }
  }

  // Process lines sequentially
  for (const line of lines) {
    // Check if it's a header
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      hasComplexFormatting = true;

      // Flush any accumulated content before the header
      flushCurrentSection();

      // Add the header as its own block
      const headerText = headerMatch[2] || '';
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${headerText}*`,
        },
      });
    } else {
      // Accumulate non-header content
      currentSection.push(line);
    }
  }

  // Flush any remaining content
  flushCurrentSection();

  // Clean up any excessive newlines in the final text
  const fallbackText = markdown.replace(/\n{3,}/g, '\n\n').trim();

  if (hasComplexFormatting && blocks.length > 0) {
    return {
      text: fallbackText, // Fallback text for notifications
      blocks,
    };
  }

  // If no complex formatting, process the entire text as one piece
  let processedText = processInlineFormatting(markdown);

  // Process lists
  const unorderedListRegex = /^[\s]*[-*+]\s+(.+)$/gm;
  processedText = processedText.replace(unorderedListRegex, '• $1');

  const orderedListRegex = /^[\s]*\d+\.\s+(.+)$/gm;
  let listCounter = 1;
  processedText = processedText.replace(orderedListRegex, (_match, content) => {
    return `${listCounter++}. ${content}`;
  });

  processedText = processedText.replace(/\n{3,}/g, '\n\n').trim();

  return { text: processedText };
}
