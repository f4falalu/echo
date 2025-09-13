import type React from 'react';
import type { MentionInputTriggerGroup } from '../MentionInput.types';

export interface MentionListGroupProps<T = string> {
  group: MentionInputTriggerGroup<T>;
  children?: React.ReactNode;
}

export function MentionListGroup<T = string>({ group, children }: MentionListGroupProps<T>) {
  return (
    <div className="mention-list-group">
      <div className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
        {group.icon && <span className="mr-2">{group.icon}</span>}
        <span>{group.label}</span>
      </div>
      <div className="pl-2">{children}</div>
    </div>
  );
}
