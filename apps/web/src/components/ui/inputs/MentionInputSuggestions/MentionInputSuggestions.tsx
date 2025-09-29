import { Command } from 'cmdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/utils';
import type { MentionInputProps, MentionInputRef } from '../MentionInput';
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
  onPressEnter,
  disabled = false,
  onChange,
  ariaLabel = 'Mention Input Suggestions',
  readOnly,
  autoFocus,
  children,
  //container
  className,
  inputContainerClassName,
  suggestionsContainerClassName,
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
  const [hasResults, setHasResults] = useState(!!suggestionItems.length);

  const commandListNavigatedRef = useRef(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const mentionsInputRef = useRef<MentionInputRef>(null);
  console.log(hasResults);

  const showSuggestionList = !hasClickedSelect && suggestionItems.length > 0;

  const onChangeInputValue: MentionInputProps['onChange'] = useCallback(
    (transformedValue, arrayValue, rawValue) => {
      setValue(value);
      setHasClickedSelect(false);
      // Reset command list navigation when user types
      commandListNavigatedRef.current = false;
      onChange?.(transformedValue, arrayValue, rawValue);
    },
    []
  );

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
      setHasResults(false);
    }
  );

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
    <Command
      ref={commandRef}
      value={value}
      label={ariaLabel}
      className={cn('relative border rounded overflow-hidden bg-background shadow', className)}
      shouldFilter={shouldFilter}
      filter={filter}
    >
      <MentionInputSuggestionsContainer className={inputContainerClassName}>
        <MentionInputSuggestionsMentionsInput
          ref={mentionsInputRef}
          defaultValue={defaultValue}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={placeholder}
          mentions={mentions}
          value={value}
          onChange={onChangeInputValue}
          onMentionItemClick={onMentionItemClick}
          onPressEnter={onPressEnter}
          commandListNavigatedRef={commandListNavigatedRef}
          disabled={disabled}
        />
        {children && <div className="mt-3">{children}</div>}
      </MentionInputSuggestionsContainer>
      {hasResults && <div className="border-b mb-1.5" />}
      <MentionInputSuggestionsList
        show={showSuggestionList}
        className={cn(suggestionsContainerClassName, hasResults && 'pb-1.5')}
      >
        <MentionInputSuggestionsItemsSelector
          suggestionItems={suggestionItems}
          onSelect={onSelectItem}
          addValueToInput={addSuggestionValueToInput}
          closeOnSelect={closeSuggestionOnSelect}
          hasResults={hasResults}
          setHasResults={setHasResults}
        />

        <MentionInputSuggestionsEmpty
          setHasResults={setHasResults}
          emptyComponent={emptyComponent}
        />
      </MentionInputSuggestionsList>
    </Command>
  );
};
