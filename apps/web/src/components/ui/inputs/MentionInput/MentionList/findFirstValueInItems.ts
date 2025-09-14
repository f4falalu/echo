import type { MentionInputTriggerItem, MentionTriggerItem } from '../MentionInput.types';

export const findFirstValueInItems = <T = string>(
  items: MentionInputTriggerItem<T>[]
): T | undefined => {
  for (const item of items) {
    // Skip separators
    if ('type' in item && item.type === 'separator') {
      continue;
    }

    // If it's a group, recursively search within the group's items
    if ('type' in item && item.type === 'group') {
      const groupResult = findFirstValueInGroupItems(item.items);
      if (groupResult !== undefined) {
        return groupResult;
      }
      continue;
    }

    // If it's a regular item with a value, return it
    if ('value' in item) {
      return item.value;
    }
  }

  return undefined;
};

const findFirstValueInGroupItems = <T = string>(items: MentionTriggerItem<T>[]): T | undefined => {
  for (const item of items) {
    // If it's a regular item with a value, return it
    if ('value' in item) {
      return item.value;
    }
  }

  return undefined;
};
