import React from 'react';
import { useMemoizedFn } from '@/hooks';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckedState } from '@radix-ui/react-checkbox';

export const MemoizedCheckbox = React.memo(
  ({
    checked,
    indeterminate,
    onChange
  }: {
    checked: boolean;
    indeterminate: boolean;
    onChange: (v: boolean, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }) => {
    const handleChange = useMemoizedFn(
      (checkedState: CheckedState, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        onChange?.(checkedState === true, e);
      }
    );

    return (
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onClick={(e) => handleChange(!checked, e)}
      />
    );
  }
);
MemoizedCheckbox.displayName = 'MemoizedCheckbox';
