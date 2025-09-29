import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';
import type {
  MentionInputSuggestionsDropdownGroup,
  MentionInputSuggestionsOnSelectParams,
} from './MentionInputSuggestions.types';
import { MentionInputSuggestionsItemsSelector } from './MentionInputSuggestionsItemSelector';

export type MentionInputSuggestionsGroupProps = MentionInputSuggestionsDropdownGroup & {
  onSelect: (params: MentionInputSuggestionsOnSelectParams) => void;
} & {
  className?: string;
  style?: React.CSSProperties;
  hasResults: boolean;
  setHasResults: (hasResults: boolean) => void;
};

export const MentionInputSuggestionsGroup = ({
  suggestionItems,
  label,
  onSelect,
  addValueToInput,
  className,
  closeOnSelect,
  style,
  ...rest
}: MentionInputSuggestionsGroupProps) => {
  return (
    <Command.Group
      className={cn(
        'text-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className
      )}
      style={style}
      heading={label}
    >
      <MentionInputSuggestionsItemsSelector
        suggestionItems={suggestionItems}
        onSelect={onSelect}
        addValueToInput={addValueToInput}
        closeOnSelect={closeOnSelect}
        {...rest}
      />
    </Command.Group>
  );
};
