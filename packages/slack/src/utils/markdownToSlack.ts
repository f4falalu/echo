import type { SlackBlock } from '../types/blocks';

export interface MarkdownConversionResult {
  text: string;
  blocks?: SlackBlock[];
}

export function convertMarkdownToSlack(markdown: string): MarkdownConversionResult {
  if (!markdown || typeof markdown !== 'string') {
    return { text: markdown || '' };
  }

  let text = markdown;
  const blocks: SlackBlock[] = [];
  let hasComplexFormatting = false;

  const headerRegex = /^(#{1,6})\s+(.+)$/gm;
  const headerMatches = [...text.matchAll(headerRegex)];

  if (headerMatches.length > 0) {
    hasComplexFormatting = true;
    for (const match of headerMatches) {
      const level = match[1]?.length || 1;
      const headerText = match[2] || '';

      const slackHeader = level <= 2 ? `*${headerText}*` : `*${headerText}*`;

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: slackHeader,
        },
      });
    }

    text = text.replace(headerRegex, '');
  }

  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  text = text.replace(codeBlockRegex, (match, language, code) => {
    return `\`\`\`${language || ''}\n${code.trim()}\n\`\`\``;
  });

  const inlineCodeRegex = /`([^`]+)`/g;
  text = text.replace(inlineCodeRegex, '`$1`');

  const boldPlaceholder = '___BOLD_PLACEHOLDER___';
  const boldMatches: Array<{ placeholder: string; replacement: string }> = [];
  let boldCounter = 0;

  const boldRegex = /(\*\*|__)(.*?)\1/g;
  text = text.replace(boldRegex, (match, delimiter, content) => {
    const placeholder = `${boldPlaceholder}${boldCounter}${boldPlaceholder}`;
    const processedContent = content.replace(/\*([^*]+)\*/g, '_$1_').replace(/_([^_]+)_/g, '_$1_');
    boldMatches.push({ placeholder, replacement: `*${processedContent}*` });
    boldCounter++;
    return placeholder;
  });

  const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;
  text = text.replace(italicRegex, (_match, group1, group2) => {
    const content = group1 || group2;
    return `_${content}_`;
  });

  for (const { placeholder, replacement } of boldMatches) {
    text = text.replace(placeholder, replacement);
  }

  const unorderedListRegex = /^[\s]*[-*+]\s+(.+)$/gm;
  text = text.replace(unorderedListRegex, '• $1');

  const orderedListRegex = /^[\s]*\d+\.\s+(.+)$/gm;
  let listCounter = 1;
  text = text.replace(orderedListRegex, (_match, content) => {
    return `${listCounter++}. ${content}`;
  });

  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (hasComplexFormatting && blocks.length > 0) {
    if (text.trim()) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text.trim(),
        },
      });
    }

    return {
      text: markdown, // Fallback text for notifications
      blocks,
    };
  }

  return { text };
}
