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
    onChange: (v: boolean) => void;
  }) => {
    const handleChange = useMemoizedFn((checkedState: CheckedState) => {
      onChange?.(checkedState === true);
    });

    return (
      <Checkbox checked={checked} indeterminate={indeterminate} onCheckedChange={handleChange} />
    );
  }
);
MemoizedCheckbox.displayName = 'MemoizedCheckbox';
