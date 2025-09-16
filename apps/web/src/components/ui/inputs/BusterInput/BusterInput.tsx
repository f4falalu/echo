import { Command } from 'cmdk';
import { useCallback, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterInputProps, BusterOnSelectParams } from './BusterInput.types';
import { BusterInputContainer } from './BusterInputContainer';
import { BusterInputEmpty } from './BusterInputEmpty';
import { BusterInputList } from './BusterInputList';
import { BusterItemsSelector } from './BusterItemSelector';
import { BusterMentionsInput } from './BusterMentionsInput';

export const BusterInput = ({
  placeholder,
  defaultValue,
  value: valueProp,
  emptyComponent,
  submitting,
  onSubmit,
  disabled: disabledGlobal = false,
  onStop,
  sendIcon,
  secondaryActions,
  variant = 'default',
  onChange,
  ariaLabel = 'Buster Input',
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
}: BusterInputProps) => {
  const [hasClickedSelect, setHasClickedSelect] = useState(false);
  const [value, setValue] = useState(valueProp ?? defaultValue);

  const showSuggestionList = !hasClickedSelect && suggestionItems.length > 0;

  const onChangeInputValue = useCallback((value: string) => {
    setValue(value);
    setHasClickedSelect(false);
    onChange?.(value);
  }, []);

  const onSelectItem = useMemoizedFn(({ onClick, ...params }: BusterOnSelectParams) => {
    const { addValueToInput, value, loading, inputValue, label, disabled } = params;
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
    if (addValueToInput) setValue(inputValue ?? String(label));
    onClick?.();
    if (closeSuggestionOnSelect) setHasClickedSelect(true);
    onSuggestionItemClick?.(params);
  });

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

  return (
    <Command label={ariaLabel} className="relative">
      <BusterInputContainer
        onSubmit={onSubmitPreflight}
        onStop={onStopPreflight}
        submitting={submitting}
        disabled={disabledGlobal}
        sendIcon={sendIcon}
        secondaryActions={secondaryActions}
        variant={variant}
      >
        <BusterMentionsInput
          autoFocus
          defaultValue={defaultValue}
          readOnly
          placeholder={placeholder}
          mentions={mentions}
          value={value}
          onChangeInputValue={onChangeInputValue}
          shouldFilter={shouldFilter}
          filter={filter}
          onMentionItemClick={onMentionItemClick}
        />
      </BusterInputContainer>
      <BusterInputList show={showSuggestionList}>
        <BusterItemsSelector
          suggestionItems={suggestionItems}
          onSelect={onSelectItem}
          addValueToInput={addSuggestionValueToInput}
          closeOnSelect={closeSuggestionOnSelect}
        />
        {emptyComponent && <BusterInputEmpty>{emptyComponent}</BusterInputEmpty>}
      </BusterInputList>
    </Command>
  );
};
