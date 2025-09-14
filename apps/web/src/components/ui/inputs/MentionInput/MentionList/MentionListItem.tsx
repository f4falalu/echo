import React from 'react';
import { Text } from '@/components/ui/typography/Text';
import { cn } from '@/lib/utils';
import type { MentionTriggerItemExtended } from './MentionListSelector';

export function MentionListItem<T = string>({
  isSelected,
  value,
  label,
  icon,
  loading,
  disabled,
  setSelectedItem,
  onSelectItem,
  secondaryContent,
}: MentionTriggerItemExtended<T>) {
  return (
    <div
      onClick={() => onSelectItem(value)}
      onMouseEnter={() => setSelectedItem(value)}
      data-disabled={disabled}
      data-loading={loading}
      data-selected={isSelected}
      className={cn(
        'flex items-center justify-between gap-x-1.5',
        `cursor-pointer px-2.5 h-8 text-base rounded transition-all duration-100`,
        isSelected && 'bg-item-hover'
      )}
    >
      <div className="flex items-center space-x-2">
        {icon && <span className="text-icon-color">{icon}</span>}
        <Text>{label}</Text>
      </div>

      {secondaryContent && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {secondaryContent}
        </span>
      )}
    </div>
  );
}
