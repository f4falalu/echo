'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
// import { Input, InputRef } from 'antd';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';
import { Input } from '../inputs/Input';

const editableTitleVariants = cva('relative flex items-center justify-between', {
  variants: {
    level: {
      1: 'text-3xl',
      2: 'text-2xl',
      3: 'text-xl',
      4: 'text-md',
      5: 'text-base'
    }
  },
  defaultVariants: {
    level: 4
  }
});

export const EditableTitle = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      children: string;
      onEdit?: (b: boolean) => void;
      onChange: (value: string) => void;
      onSetValue?: (value: string) => void;
      onPressEnter?: () => void;
      disabled?: boolean;
      editing?: boolean;
      className?: string;
      placeholder?: string;
      style?: React.CSSProperties;
      inputClassName?: string;
    } & VariantProps<typeof editableTitleVariants>
  >(
    (
      {
        style,
        disabled,
        className = '',
        inputClassName = '',
        placeholder,
        onPressEnter,
        editing,
        children,
        level = 4,
        onEdit,
        onChange,
        onSetValue
      },
      ref
    ) => {
      const inputRef = useRef<HTMLInputElement>(null);
      const [value, setValue] = React.useState(children);

      useLayoutEffect(() => {
        setValue(children);
      }, [children]);

      useEffect(() => {
        if (editing) {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }, [editing]);

      return (
        <div
          ref={ref}
          className={cn('relative flex items-center justify-between', className)}
          style={style}>
          <Input
            placeholder={placeholder}
            ref={inputRef}
            disabled={disabled}
            variant="ghost"
            className={cn(
              'w-full cursor-text! px-0! py-0! leading-1',
              editableTitleVariants({ level }),
              inputClassName
            )}
            value={value}
            onChange={(e) => {
              if (e.target.value !== value) setValue(e.target.value);
              onSetValue?.(e.target.value);
            }}
            onBlur={() => {
              onChange(value);
              onEdit?.(false);
            }}
            onFocus={() => {
              onEdit?.(true);
            }}
            onPressEnter={() => {
              onChange(value);
              onPressEnter?.();
            }}
          />
        </div>
      );
    }
  )
);

EditableTitle.displayName = 'EditableTitle';
