import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';
import type { MentionInputSuggestionsDropdownItem, MentionInputSuggestionsOnSelectParams } from './MentionInputSuggestions.types';

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
  shortcut,
  icon,
  onClick,
  disabled,
  loading,
  closeOnSelect,
  type,
  addValueToInput,
  onSelect,
  ...props
}: MentionInputSuggestionsItemProps) => {
  return (
    <Command.Item
      className={cn(
        'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        props.className
      )}
      value={value}
      {...props}
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
      {label}
    </Command.Item>
  );
};
