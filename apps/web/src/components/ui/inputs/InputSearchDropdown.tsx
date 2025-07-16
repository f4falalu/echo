'use client';

import React, { useState, useMemo } from 'react';
import { Select } from '../select/Select';
import { useMemoizedFn } from '@/hooks';

export interface InputSearchDropdownProps {
  options: {
    label: string | React.ReactNode;
    value: string;
  }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string | false;
  onSearch: ((value: string) => Promise<void>) | ((value: string) => void);
  className?: string;
  disabled?: boolean;
  matchPopUpWidth?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onPressEnter: (value: string) => void;
}

export const InputSearchDropdown = ({
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
  disabled = false
}: InputSearchDropdownProps) => {
  const [inputValue, setInputValue] = useState(value);

  const handleSearch = useMemo(() => {
    return {
      type: 'async' as const,
      fn: async (searchTerm: string) => {
        await onSearch(searchTerm);
      }
    };
  }, [onSearch]);

  const handleChange = useMemoizedFn((value: string) => {
    setInputValue(value);
    onChange?.(value);
  });

  return (
    <Select
      items={options}
      placeholder={placeholder}
      onChange={onSelect}
      disabled={disabled}
      clearable={false}
      className={className}
      matchPopUpWidth={matchPopUpWidth}
      emptyMessage={emptyMessage}
      inputValue={inputValue}
      onInputValueChange={handleChange}
      search={handleSearch}
      hideChevron={true}
      onPressEnter={onPressEnter}
    />
  );
};
