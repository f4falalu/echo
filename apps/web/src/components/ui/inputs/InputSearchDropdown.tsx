'use client';

import React, { useMemo } from 'react';
import { Select, type SelectItem } from '../select/Select';
import { cn } from '@/lib/utils';

export interface InputSearchDropdownProps<T = string> {
  options: SelectItem<T>[];
  onSelect: (value: T) => void;
  placeholder?: string;
  emptyMessage?: string | false;
  onSearch: ((value: string) => Promise<void>) | ((value: string) => void);
  className?: string;
  disabled?: boolean;
  matchPopUpWidth?: boolean;
  value: string;
  onChange?: (value: string) => void;
  onPressEnter: (value: string) => void;
  loading?: boolean;
}

export const InputSearchDropdown = <T extends string>({
  options,
  onSelect,
  onPressEnter,
  placeholder = 'Search...',
  emptyMessage = false,
  matchPopUpWidth = true,
  onSearch,
  value,
  className,
  onChange,
  loading = false,
  disabled = false
}: InputSearchDropdownProps<T>) => {
  const handleSearch = useMemo(() => {
    return {
      type: 'async' as const,
      fn: async (searchTerm: string) => {
        await onSearch(searchTerm);
      }
    };
  }, [onSearch]);

  return (
    <Select
      items={value.length > 0 ? options : []}
      placeholder={placeholder}
      onChange={onSelect}
      disabled={disabled}
      clearable={false}
      className={className}
      matchPopUpWidth={matchPopUpWidth}
      emptyMessage={emptyMessage}
      inputValue={value}
      onInputValueChange={onChange}
      search={handleSearch}
      hideChevron={true}
      clearOnSelect={false}
      loading={loading}
      onPressEnter={onPressEnter}
      type="input"
    />
  );
};
