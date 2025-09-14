import React from 'react';
import type {
  MentionInputTriggerGroup,
  MentionInputTriggerItem,
  MentionTriggerItem,
} from '../MentionInput.types';
import { MentionListGroup } from './MentionListGroup';
import { MentionListItem } from './MentionListItem';
import { MentionListSeperator } from './MentionListSeperator';

type ExtendedOptions<T = string> = {
  selectedItem: T | undefined;
  setSelectedItem: (item: T | undefined) => void;
};

export type MentionInputTriggerItemExtended<T = string> = MentionInputTriggerItem<T> &
  ExtendedOptions<T>;

export type MentionListGroupExtended<T = string> = MentionInputTriggerGroup<T> & ExtendedOptions<T>;

export type MentionTriggerItemExtended<T = string> = MentionTriggerItem<T> &
  ExtendedOptions<T> & {
    isSelected: boolean;
  };

export function MentionListSelector<T = string>(props: MentionInputTriggerItemExtended<T>) {
  const { type } = props;

  if (type === 'group') {
    return <MentionListGroup {...props} />;
  }

  if (type === 'separator') {
    return <MentionListSeperator {...props} />;
  }

  if (type === 'item' || !type) {
    const isSelected = props.selectedItem === props.value;
    console.log('isSelected', props.selectedItem, isSelected);
    return <MentionListItem {...props} isSelected={isSelected} />;
  }

  const _exhaustiveCheck: never = type;

  return null;
}
