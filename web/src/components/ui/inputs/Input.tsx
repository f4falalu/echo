import React from 'react';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';
import { useMemoizedFn } from 'ahooks';

const inputVariants = cva(
  'flex w-full rounded border px-2.5 text-base transition-all duration-200  disabled:cursor-not-allowed disabled:bg-item-select disabled:text-gray-light ',
  {
    variants: {
      variant: {
        default:
          'shadow bg-background border placeholder:text-gray-light hover:border-primary focus:border-primary focus-visible:border-primary outline-none disabled:border-border',
        ghost: 'border-none bg-transparent shadow-none'
      },
      size: {
        default: 'h-7',
        tall: 'h-8',
        small: 'h-6'
      }
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = 'default',
      variant = 'default',
      type = 'text',
      onPressEnter,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = useMemoizedFn((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onPressEnter) {
        onPressEnter(e);
      }
      onKeyDown?.(e);
    });

    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant }), className)}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
