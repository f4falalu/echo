import { useEffect, useRef } from 'react';
import { Text } from '@/components/ui/typography/Text';
import { cn } from '@/lib/utils';
import { useMentionListRef } from './MentionList';
import type { MentionTriggerItemExtended } from './MentionListSelector';

export function MentionListItem<T = string>({
  isSelected,
  value,
  label,
  icon,
  loading,
  disabled,
  onSelectItem,
  secondaryContent,
}: Omit<MentionTriggerItemExtended<T>, 'setSelectedItem'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useMentionListRef();

  useEffect(() => {
    if (isSelected && containerRef.current && listRef?.current) {
      containerRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isSelected, listRef]);

  return (
    <div
      ref={containerRef}
      onClick={() => onSelectItem(value)}
      data-testid={`mention-list-item-${value}`}
      data-disabled={disabled}
      data-loading={loading}
      data-selected={isSelected}
      className={cn(
        'group/mention-list-item',
        'flex items-center justify-between gap-x-1.5 overflow-hidden',
        `cursor-pointer px-2.5 min-h-8 text-base rounded transition-all duration-100`,
        isSelected && 'bg-item-hover'
      )}
    >
      <div className="flex items-center space-x-2 overflow-hidden">
        {icon && <span className="text-icon-color">{icon}</span>}
        {typeof label === 'string' ? <Text truncate>{label}</Text> : label}
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
