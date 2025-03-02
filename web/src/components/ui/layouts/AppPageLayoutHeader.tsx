import { cn } from '@/lib/utils';
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const headerVariants = cva('bg-background flex max-h-[38px] min-h-[38px] items-center border-b', {
  variants: {
    variant: {
      default: 'px-4.5',
      list: 'px-10'
    }
  }
});

export const AppPageLayoutHeader: React.FC<
  React.PropsWithChildren<
    {
      className?: string;
    } & VariantProps<typeof headerVariants>
  >
> = ({ children, className = '', variant = 'default' }) => {
  return <div className={cn(headerVariants({ variant }), className)}>{children}</div>;
};
