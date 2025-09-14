import type { MentionInputTriggerItem, MentionTriggerItem } from '../MentionInput.types';

export const findFirstValueInItems = <T = string>(
  items: MentionInputTriggerItem<T>[]
): T | undefined => {
  const allValues = getAllSelectableValues(items);
  return allValues[0];
};

export const findNextValue = <T = string>(
  items: MentionInputTriggerItem<T>[],
  currentValue: T | undefined
): T | undefined => {
  const allValues = getAllSelectableValues(items);

  if (allValues.length === 0) {
    return undefined;
  }

  if (currentValue === undefined) {
    return allValues[0];
  }

  const currentIndex = allValues.indexOf(currentValue);
  if (currentIndex === -1) {
    return allValues[0];
  }

  // Wrap around to the beginning when reaching the end
  return allValues[(currentIndex + 1) % allValues.length];
};

export const findPreviousValue = <T = string>(
  items: MentionInputTriggerItem<T>[],
  currentValue: T | undefined
): T | undefined => {
  const allValues = getAllSelectableValues(items);

  if (allValues.length === 0) {
    return undefined;
  }

  if (currentValue === undefined) {
    return allValues[allValues.length - 1];
  }

  const currentIndex = allValues.indexOf(currentValue);
  if (currentIndex === -1) {
    return allValues[allValues.length - 1];
  }

  // Wrap around to the end when reaching the beginning
  return allValues[(currentIndex - 1 + allValues.length) % allValues.length];
};

export const findItemByValue = <T = string>(
  items: MentionInputTriggerItem<T>[],
  value: T
): MentionTriggerItem<T> | undefined => {
  for (const item of items) {
    // Skip separators
    if ('type' in item && item.type === 'separator') {
      continue;
    }

    // If it's a group, search within the group's items
    if ('type' in item && item.type === 'group') {
      const foundInGroup = findItemByValueInGroup(item.items, value);
      if (foundInGroup) {
        return foundInGroup;
      }
      continue;
    }

    // If it's a regular item with the matching value, return it
    if ('value' in item && item.value === value) {
      return item;
    }
  }

  return undefined;
};

/**
 * Extracts all selectable values from items, flattening groups and skipping separators
 */
const getAllSelectableValues = <T = string>(items: MentionInputTriggerItem<T>[]): T[] => {
  const values: T[] = [];

  for (const item of items) {
    // Skip separators
    if ('type' in item && item.type === 'separator') {
      continue;
    }

    // If it's a group, recursively extract values from group items
    if ('type' in item && item.type === 'group') {
      values.push(...getAllSelectableValuesFromGroup(item.items));
      continue;
    }

    // If it's a regular item with a value, add it
    if ('value' in item) {
      values.push(item.value);
    }
  }

  return values;
};

/**
 * Helper to find an item by value within group items (which are MentionTriggerItem[])
 */
const findItemByValueInGroup = <T = string>(
  items: MentionTriggerItem<T>[],
  value: T
): MentionTriggerItem<T> | undefined => {
  for (const item of items) {
    if ('value' in item && item.value === value) {
      return item;
    }
  }
  return undefined;
};

/**
 * Helper to extract values from group items (which are MentionTriggerItem[])
 */
const getAllSelectableValuesFromGroup = <T = string>(items: MentionTriggerItem<T>[]): T[] => {
  const values: T[] = [];

  for (const item of items) {
    if ('value' in item) {
      values.push(item.value);
    }
  }

  return values;
};
