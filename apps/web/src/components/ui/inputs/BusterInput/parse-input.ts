import type { BusterMentionItems } from './BusterInput.types';

export const DEFAULT_MENTION_MARKUP = '@[__display__](__id__)';

export const parseMarkupInput = <V = string, T extends string = string>({
  items,
}: {
  items: Pick<BusterMentionItems<V, T>, 'items' | 'trigger'>;
}): string => {
  return '';
};
