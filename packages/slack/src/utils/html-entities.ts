/**
 * Decode HTML entities from Slack messages
 * Slack API returns text with HTML entities encoded (e.g., &lt; for <, &gt; for >, &amp; for &)
 * This function decodes these entities back to their original characters
 */

/**
 * Map of HTML entities to their decoded characters
 * Based on common entities found in Slack messages
 */
const HTML_ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#47;': '/',
  '&#96;': '`',
  '&#x60;': '`',
  '&nbsp;': ' ',
  '&#160;': ' ',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hellip;': '…',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
};

/**
 * Decode HTML entities in a string
 * @param text - The text containing HTML entities
 * @returns The decoded text with HTML entities replaced by their characters
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) {
    return text;
  }

  // Replace known HTML entities
  let decodedText = text;
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    // Use global replace to handle multiple occurrences
    const regex = new RegExp(escapeRegExp(entity), 'g');
    decodedText = decodedText.replace(regex, replacement);
  }

  // Handle numeric character references (e.g., &#123; or &#x7B;)
  // Decimal: &#123;
  decodedText = decodedText.replace(/&#(\d+);/g, (_match, code) => {
    const charCode = Number.parseInt(code, 10);
    return String.fromCharCode(charCode);
  });

  // Hexadecimal: &#x7B; or &#X7B;
  decodedText = decodedText.replace(/&#[xX]([0-9a-fA-F]+);/g, (_match, code) => {
    const charCode = Number.parseInt(code, 16);
    return String.fromCharCode(charCode);
  });

  return decodedText;
}

/**
 * Escape special regex characters in a string
 * @param string - The string to escape
 * @returns The escaped string safe for use in regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Decode HTML entities in Slack message text while preserving Slack-specific formatting
 * This function is aware of Slack's message format and preserves user/channel mentions
 * @param slackText - The Slack message text with potential HTML entities
 * @returns The decoded text with HTML entities replaced
 */
export function decodeSlackMessageText(slackText: string | undefined): string | undefined {
  if (!slackText) {
    return slackText;
  }

  // Slack uses <@USERID> for user mentions and <#CHANNELID> for channel mentions
  // These should not be decoded as HTML entities, so we need to be careful
  // The &lt; and &gt; around these are actual HTML entities that should be decoded
  // But the < and > that are already part of mentions should be preserved

  // First, protect Slack mentions by temporarily replacing them
  const mentionPlaceholders = new Map<string, string>();
  let placeholderIndex = 0;

  // Protect user mentions <@USERID>
  let protectedText = slackText.replace(/<@[A-Z0-9]+>/g, (match) => {
    const placeholder = `__SLACK_USER_MENTION_${placeholderIndex++}__`;
    mentionPlaceholders.set(placeholder, match);
    return placeholder;
  });

  // Protect channel mentions <#CHANNELID>
  protectedText = protectedText.replace(/<#[A-Z0-9]+>/g, (match) => {
    const placeholder = `__SLACK_CHANNEL_MENTION_${placeholderIndex++}__`;
    mentionPlaceholders.set(placeholder, match);
    return placeholder;
  });

  // Protect links <URL|text>
  protectedText = protectedText.replace(/<[^>]+\|[^>]+>/g, (match) => {
    const placeholder = `__SLACK_LINK_${placeholderIndex++}__`;
    mentionPlaceholders.set(placeholder, match);
    return placeholder;
  });

  // Protect simple links <URL>
  protectedText = protectedText.replace(/<(https?:\/\/[^>]+)>/g, (match) => {
    const placeholder = `__SLACK_URL_${placeholderIndex++}__`;
    mentionPlaceholders.set(placeholder, match);
    return placeholder;
  });

  // Now decode HTML entities
  let decodedText = decodeHtmlEntities(protectedText);

  // Restore the protected Slack mentions
  for (const [placeholder, original] of mentionPlaceholders) {
    decodedText = decodedText.replace(placeholder, original);
  }

  return decodedText;
}
