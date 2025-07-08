import React from 'react';
import { cn } from '@/lib/classMerge';
import { cva, type VariantProps } from 'class-variance-authority';

const pillVariants = cva('rounded-sm border px-1 py-0.5 text-xs', {
  variants: {
    variant: {
      gray: 'bg-item-select text-gray-dark',
      danger: 'bg-danger-background text-danger-foreground border-none',
      success: 'bg-success-background text-success-foreground border-none'
    }
  },
  defaultVariants: {
    variant: 'gray'
  }
});

export interface PillProps extends React.ComponentProps<'div'>, VariantProps<typeof pillVariants> {}

export const Pill: React.FC<PillProps> = ({ children, className, variant, ...props }) => {
  return (
    <div className={cn(pillVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
};
