import { Command } from 'cmdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { MentionInputRef } from '../MentionInput';
import type {
  MentionInputSuggestionsOnSelectParams,
  MentionInputSuggestionsProps,
} from './MentionInputSuggestions.types';
import { MentionInputSuggestionsContainer } from './MentionInputSuggestionsContainer';
import { MentionInputSuggestionsEmpty } from './MentionInputSuggestionsEmpty';
import { MentionInputSuggestionsItemsSelector } from './MentionInputSuggestionsItemSelector';
import { MentionInputSuggestionsList } from './MentionInputSuggestionsList';
import { MentionInputSuggestionsMentionsInput } from './MentionInputSuggestionsMentionsInput';

export const MentionInputSuggestions = ({
  placeholder,
  defaultValue,
  value: valueProp,
  emptyComponent,
  submitting,
  onSubmit,
  onPressEnter,
  disabled: disabledGlobal = false,
  onStop,
  sendIcon,
  secondaryActions,
  variant = 'default',
  onChange,
  ariaLabel = 'Mention Input Suggestions',
  readOnly,
  autoFocus,
  children,
  //suggestions
  suggestionItems,
  closeSuggestionOnSelect = true,
  addSuggestionValueToInput = true,
  onSuggestionItemClick,
  filter,
  shouldFilter,
  //mentions
  onMentionItemClick,
  mentions,
}: MentionInputSuggestionsProps) => {
  const [hasClickedSelect, setHasClickedSelect] = useState(false);
  const [value, setValue] = useState(valueProp ?? defaultValue);
  const commandListNavigatedRef = useRef(false);

  const commandRef = useRef<HTMLDivElement>(null);
  const mentionsInputRef = useRef<MentionInputRef>(null);

  const showSuggestionList = !hasClickedSelect && suggestionItems.length > 0;

  const onChangeInputValue = useCallback((value: string) => {
    setValue(value);
    setHasClickedSelect(false);
    // Reset command list navigation when user types
    commandListNavigatedRef.current = false;
    onChange?.(value);
  }, []);

  const onSelectItem = useMemoizedFn(
    ({ onClick, ...params }: MentionInputSuggestionsOnSelectParams) => {
      const { addValueToInput, loading, inputValue, label, disabled } = params;
      if (disabled) {
        console.warn('Item is disabled', params);
        return;
      }
      if (submitting) {
        console.warn('Input is submitting');
        return;
      }
      if (loading) {
        console.warn('Item is loading', params);
        return;
      }
      if (addValueToInput) {
        const stringValue = inputValue ?? String(label);
        mentionsInputRef.current?.editor?.commands.setContent(stringValue);
        setValue(stringValue);
      }
      onClick?.();
      if (closeSuggestionOnSelect) setHasClickedSelect(true);
      onSuggestionItemClick?.(params);
    }
  );

  const onSubmitPreflight = useMemoizedFn((value: string) => {
    if (submitting) {
      console.warn('Input is submitting');
      return;
    }
    if (disabledGlobal) {
      console.warn('Input is disabledGlobal');
      return;
    }
    onSubmit(value);
  });

  const onStopPreflight = useMemoizedFn(() => {
    onStop();
  });

  // Track arrow key navigation in the command list
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSuggestionList && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        commandListNavigatedRef.current = true;
      }

      // If Enter is pressed and command list was navigated, manually trigger selection
      if (showSuggestionList && event.key === 'Enter' && commandListNavigatedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        // Find the currently selected item and trigger its click
        const selectedItem = commandElement?.querySelector('[data-selected="true"]') as HTMLElement;
        if (selectedItem) {
          selectedItem.click();
        }
      }
    };
    const commandElement = commandRef.current;
    if (commandElement) {
      commandElement.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => {
        commandElement.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [showSuggestionList]);

  return (
    <Command ref={commandRef} value={value} label={ariaLabel} className="relative">
      <MentionInputSuggestionsContainer>
        <MentionInputSuggestionsMentionsInput
          ref={mentionsInputRef}
          defaultValue={defaultValue}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={placeholder}
          mentions={mentions}
          value={value}
          onChange={onChangeInputValue}
          shouldFilter={shouldFilter}
          filter={filter}
          onMentionItemClick={onMentionItemClick}
          onPressEnter={onPressEnter || onSubmit}
          commandListNavigatedRef={commandListNavigatedRef}
        />
        {children}
      </MentionInputSuggestionsContainer>
      <MentionInputSuggestionsList show={showSuggestionList}>
        <MentionInputSuggestionsItemsSelector
          suggestionItems={suggestionItems}
          onSelect={onSelectItem}
          addValueToInput={addSuggestionValueToInput}
          closeOnSelect={closeSuggestionOnSelect}
        />
        {emptyComponent && (
          <MentionInputSuggestionsEmpty>{emptyComponent}</MentionInputSuggestionsEmpty>
        )}
      </MentionInputSuggestionsList>
    </Command>
  );
};
