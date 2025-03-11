import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { MemoizedCheckbox } from './MemoizedCheckbox';
import { WIDTH_OF_CHECKBOX_COLUMN } from './config';
import { cn } from '@/lib/classMerge';

export const CheckboxColumn: React.FC<{
  checkStatus: 'checked' | 'unchecked' | 'indeterminate' | undefined;
  onChange: (v: boolean) => void;
  className?: string;
}> = React.memo(({ checkStatus, onChange, className = '' }) => {
  const showBox = checkStatus === 'checked'; //|| checkStatus === 'indeterminate';

  const onClickStopPropagation = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  const onChangePreflight = useMemoizedFn((e: boolean) => {
    onChange(e);
  });

  return (
    <div
      onClick={onClickStopPropagation}
      style={{
        width: `${WIDTH_OF_CHECKBOX_COLUMN}px`,
        minWidth: `${WIDTH_OF_CHECKBOX_COLUMN}px`
      }}
      className={cn(
        className,
        'flex items-center justify-center pr-1 pl-1 opacity-0 group-hover:opacity-100',
        showBox ? 'opacity-100' : ''
      )}>
      <MemoizedCheckbox
        checked={checkStatus === 'checked'}
        indeterminate={checkStatus === 'indeterminate'}
        onChange={onChangePreflight}
      />
    </div>
  );
});
CheckboxColumn.displayName = 'CheckboxColumn';
