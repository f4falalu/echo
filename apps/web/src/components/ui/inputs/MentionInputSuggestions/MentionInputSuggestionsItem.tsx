import { Command, useCommandState } from 'cmdk';
import type React from 'react';
import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import type {
  MentionInputSuggestionsDropdownItem,
  MentionInputSuggestionsOnSelectParams,
} from './MentionInputSuggestions.types';

export type MentionInputSuggestionsItemProps = {
  onSelect: (d: MentionInputSuggestionsOnSelectParams) => void;
} & MentionInputSuggestionsDropdownItem & {
    className?: string;
    style?: React.CSSProperties;
  };

export const MentionInputSuggestionsItem = ({
  value,
  inputValue,
  label,
  icon,
  onClick,
  disabled,
  loading,
  closeOnSelect,
  type,
  addValueToInput,
  onSelect,
  className,
  style,
}: MentionInputSuggestionsItemProps) => {
  return (
    <Command.Item
      className={cn(
        'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        !disabled ? 'cursor-pointer' : 'cursor-not-allowed',
        'text-secondary group',
        className
      )}
      value={value}
      data-testid={`type-${type}-value-${value}`}
      style={style}
      onSelect={() => {
        onSelect({
          value,
          inputValue,
          label,
          onClick,
          addValueToInput,
          closeOnSelect,
          disabled,
          loading,
        });
      }}
    >
      {icon && (
        <span className="text-icon-color min-w-4 w-4 text-center group-hover:text-foreground">
          {icon}
        </span>
      )}
      {label}
    </Command.Item>
  );
};
