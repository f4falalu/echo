import React, { useState, useEffect, useRef } from 'react';
import { Select } from '../select/Select';

export interface InputSearchDropdownProps {
  options: {
    label: string | React.ReactNode;
    value: string;
  }[];
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string | false;
  onSearch: (value: string) => void | ((value: string) => Promise<void>);
  className?: string;
  disabled?: boolean;
  matchPopUpWidth?: boolean;
  value?: string;
}

export const InputSearchDropdown = ({
  options,
  onSelect,
  placeholder = 'Search...',
  emptyMessage = false,
  matchPopUpWidth = true,
  onSearch,
  value,
  className,
  disabled = false
}: InputSearchDropdownProps) => {
  const [inputValue, setInputValue] = useState(value);

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
      onInputValueChange={setInputValue}
      search={true}
      hideChevron={true}
    />
  );
};
