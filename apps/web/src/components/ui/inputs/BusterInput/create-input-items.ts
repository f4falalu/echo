import type {
  BusterInputDropdownGroup,
  BusterInputDropdownItem,
  BusterMentionItem,
  BusterMentionItems,
} from './BusterInput.types';

export const createInputItem = <T = string>() => {
  return (item: BusterInputDropdownItem<T>) => item;
};

export const createInputItems = <T = string>() => {
  return (items: BusterInputDropdownItem<T>[]) => items;
};

export const createInputGroup = <T = string>() => {
  return (group: BusterInputDropdownGroup<T>) => group;
};

export const createInputGroups = <T = string>() => {
  return (groups: BusterInputDropdownGroup<T>[]) => groups;
};

export const createInputMention = <T = string, M = unknown>() => {
  return (mention: BusterMentionItem<T, M>) => mention;
};

export const createInputMentions = <T = string, V = string, M = unknown>() => {
  return (mentions: BusterMentionItems<T, V, M>[]) => mentions;
};
