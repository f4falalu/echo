import React from 'react';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex w-full rounded-md border px-2.5 text-base transition-all duration-200  disabled:cursor-not-allowed disabled:bg-disabled disabled:text-gray-light ',
  {
    variants: {
      variant: {
        default:
          'shadow bg-background border placeholder:text-gray-light hover:border-primary focus:border-primary focus-visible:border-primary outline-none',
        ghost: 'border-none bg-transparent shadow-none'
      },
      size: {
        default: 'h-7',
        tall: 'h-8',
        small: 'h-[18px]'
      }
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'default', variant = 'default', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
