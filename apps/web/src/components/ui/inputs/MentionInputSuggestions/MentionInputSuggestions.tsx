import { Command } from 'cmdk';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/utils';
import type { MentionInputProps, MentionInputRef } from '../MentionInput';
import type {
  MentionInputSuggestionsOnSelectParams,
  MentionInputSuggestionsProps,
  MentionInputSuggestionsRef,
} from './MentionInputSuggestions.types';
import { MentionInputSuggestionsContainer } from './MentionInputSuggestionsContainer';
import { MentionInputSuggestionsEmpty } from './MentionInputSuggestionsEmpty';
import { MentionInputSuggestionsItemsSelector } from './MentionInputSuggestionsItemSelector';
import { MentionInputSuggestionsList } from './MentionInputSuggestionsList';
import { MentionInputSuggestionsMentionsInput } from './MentionInputSuggestionsMentionsInput';

export const MentionInputSuggestions = forwardRef<
  MentionInputSuggestionsRef,
  MentionInputSuggestionsProps
>(
  (
    {
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
    }: MentionInputSuggestionsProps,
    ref
  ) => {
    const [hasClickedSelect, setHasClickedSelect] = useState(false);
    const [value, setValue] = useState(valueProp ?? defaultValue);
    const [hasResults, setHasResults] = useState(!!suggestionItems.length);

    const commandListNavigatedRef = useRef(false);
    const commandRef = useRef<HTMLDivElement>(null);
    const mentionsInputRef = useRef<MentionInputRef>(null);

    const showSuggestionList = !hasClickedSelect && suggestionItems.length > 0;

    const onChangeInputValue: MentionInputProps['onChange'] = useCallback(
      (transformedValue, arrayValue, rawValue) => {
        setValue(transformedValue);
        onChange?.(transformedValue, arrayValue, rawValue);
        commandListNavigatedRef.current = false;
        setHasClickedSelect(false);
      },
      [onChange, setHasClickedSelect]
    );

    //this is used to change the value of the input from outside the component
    const onChangeValue = useMemoizedFn((v: string | ((prevState: string) => string)) => {
      if (typeof v === 'function') {
        setValue((prevState) => {
          const newState = v(prevState);
          mentionsInputRef.current?.editor?.commands.setContent(newState);
          return newState;
        });
      } else {
        setValue(v);
        mentionsInputRef.current?.editor?.commands.setContent(v);
      }
    });

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

    const getValue = useMemoizedFn(() => {
      return mentionsInputRef.current?.getValue();
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
          const selectedItem = commandElement?.querySelector(
            '[data-selected="true"]'
          ) as HTMLElement;
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

    useImperativeHandle(
      ref,
      () => ({
        value,
        onChangeValue,
        getValue,
      }),
      [value]
    );

    return (
      <Command
        ref={commandRef}
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
  }
);
