import type React from 'react';
import type { MentionInputTriggerGroup } from '../MentionInput.types';
import { type MentionListGroupExtended, MentionListSelector } from './MentionListSelector';

export function MentionListGroup<T = string>({
  items,
  label,
  icon,
  setSelectedItem,
  selectedItem,
}: MentionListGroupExtended<T>) {
  return (
    <div className="mention-list-group">
      <div className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
      <div className="pl-2">
        {items.map((item, index) => (
          <MentionListSelector
            key={index}
            {...item}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
        ))}
      </div>
    </div>
  );
}
