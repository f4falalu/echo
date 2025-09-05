import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { cn } from '@/lib/classMerge';

const pillVariants = cva('rounded-sm border px-1 py-0.5 text-xs', {
  variants: {
    variant: {
      gray: 'bg-item-select text-gray-dark',
      danger: 'bg-danger-background text-danger-foreground border-none',
      success: 'bg-success-background text-success-foreground border-none',
    },
  },
  defaultVariants: {
    variant: 'gray',
  },
});

export interface PillProps extends React.ComponentProps<'div'>, VariantProps<typeof pillVariants> {}

export const Pill = ({ children, className, variant, ...props }: PillProps) => {
  return (
    <div className={cn(pillVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
};
