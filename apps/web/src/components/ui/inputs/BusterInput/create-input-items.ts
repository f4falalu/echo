import type { MentionTriggerItem } from '../MentionInput';
import type { BusterInputDropdownGroup, BusterInputDropdownItem } from './BusterInput.types';

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

export const createInputMention = <T = string>() => {
  return (mention: MentionTriggerItem<T>) => mention;
};

export const createInputMentions = <T = string>() => {
  return (mentions: MentionTriggerItem<T>[]) => mentions;
};
