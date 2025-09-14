import React from 'react';
import type { MentionTriggerItem } from '../MentionInput.types';
import type { MentionTriggerItemExtended } from './MentionListSelector';

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
  setSelectedItem,
}: MentionTriggerItemExtended<T>) {
  return (
    <div
      onMouseEnter={() => setSelectedItem(value)}
      className={`cursor-pointer px-2 py-1 ${isSelected ? 'bg-muted' : ''}`}
    >
      {label}
    </div>
  );
}
