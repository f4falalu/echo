import React from 'react';
import type { MentionTriggerItem } from '../MentionInput.types';

type MentionTriggerItemExtended<T = string> = MentionTriggerItem<T> & {
  isSelected: boolean;
};

export function MentionListItem<T = string>({
  isSelected,
  onSelect,
  value,
  label,
  icon,
  secondaryContent,
  loading,
  disabled,
  selected,
  doNotAddPipeOnSelect,
}: MentionTriggerItemExtended<T>) {
  return <div className={`cursor-pointer px-2 py-1 ${isSelected ? 'bg-muted' : ''}`}>{label}</div>;
}
