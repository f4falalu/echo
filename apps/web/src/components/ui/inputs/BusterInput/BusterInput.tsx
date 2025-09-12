import { Command } from 'cmdk';
import { useCallback, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { BusterInputProps, BusterOnSelectParams } from './BusterInput.types';
import { BusterInputEmpty } from './BusterInputEmpty';
import { BusterInputList } from './BusterInputList';
import { BusterItemsSelector } from './BusterItemSelector';
import { BusterMentionsInput } from './BusterMentionsInput';

export const BusterInput = ({
  placeholder,
  mentions,
  defaultValue,
  value: valueProp,

  emptyComponent,
  items,
  closeOnSelect = true,
  addValueToInput = true,
  submitting,
  onSubmit,
  onStop,
  sendIcon,
  secondaryActions,
  variant = 'default',
  onChange,
  onItemClick,
  ariaLabel = 'Buster Input',
}: BusterInputProps) => {
  const [hasClickedSelect, setHasClickedSelect] = useState(false);
  const [value, setValue] = useState(valueProp ?? defaultValue);

  const showList = !hasClickedSelect && items.length > 0;

  const onChangeInputValue = useCallback((value: string) => {
    setValue(value);
    setHasClickedSelect(false);
    //  onChange?.(value);
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
    if (closeOnSelect) setHasClickedSelect(true);
    onItemClick?.(params);
  });

  return (
    <div className="flex flex-col gap-2">
      <Command label={ariaLabel}>
        <BusterMentionsInput
          className="w-full outline-1 outline-amber-600"
          autoFocus
          defaultValue={defaultValue}
          readOnly
          placeholder={placeholder}
          mentions={mentions}
          value={value}
          onChangeInputValue={onChangeInputValue}
        />
        <BusterInputList show={showList}>
          <BusterItemsSelector
            items={items}
            onSelect={onSelectItem}
            addValueToInput={addValueToInput}
            closeOnSelect={closeOnSelect}
          />
          {emptyComponent && <BusterInputEmpty>{emptyComponent}</BusterInputEmpty>}
        </BusterInputList>
      </Command>
    </div>
  );
};
