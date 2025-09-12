import type { BusterMentionItems } from './BusterInput.types';

export const DEFAULT_MENTION_MARKUP = '@[__display__](__id__)';
const DEFAULT_MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

type BusterMentionItemsRecord<V = string, T extends string = string> = Pick<
  BusterMentionItems<V, T>,
  'items' | 'trigger'
>[];

export const parseMarkupInput = <V = string, T extends string = string>({
  input,
  items,
}: {
  input: string;
  items: BusterMentionItemsRecord<V, T>;
}): string => {
  return input.replace(DEFAULT_MENTION_REGEX, (match, _display, id) => {
    for (const mentionType of Object.values(items) as Pick<
      BusterMentionItems<V, T>,
      'items' | 'trigger'
    >[]) {
      const item = mentionType.items.find((item) => String(item.value) === String(id));
      if (item) {
        // Use parsedValue if available, otherwise use value
        return item.parsedValue ?? String(item.value);
      }
    }

    // If no matching item found in any mention type, return the original mention
    return match;
  });
};
