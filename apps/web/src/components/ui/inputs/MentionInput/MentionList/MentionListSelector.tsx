import React from 'react';
import type { MentionInputTriggerItem } from '../MentionInput.types';
import { MentionListGroup } from './MentionListGroup';
import { MentionListItem } from './MentionListItem';
import { MentionListSeperator } from './MentionListSeperator';

type MentionInputTriggerItemExtended<T = string> = MentionInputTriggerItem<T> & {
  isSelected: boolean;
  index: number;
  setSelectedIndex: (index: number) => void;
};

export function MentionListSelector<T = string>(props: MentionInputTriggerItemExtended<T>) {
  const { type } = props;

  if (type === 'group') {
    return <MentionListGroup group={props} />;
  }

  if (type === 'separator') {
    return <MentionListSeperator {...props} />;
  }

  if (type === 'item') {
    props;
    return <MentionListItem {...props} />;
  }

  if (type === undefined) {
    return null;
  }

  const _exhaustiveCheck: never = type;

  return null;
}
