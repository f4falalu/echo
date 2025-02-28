import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const contentVariants = cva('max-h-[100%] bg-background', {
  variants: {
    scrollable: {
      true: 'overflow-y-auto'
    },
    variant: {
      default: 'p-12',
      list: 'p-0'
    }
  }
});

export const AppContentPage: React.FC<
  PropsWithChildren<
    {
      className?: string;
      scrollable?: boolean;
    } & VariantProps<typeof contentVariants>
  >
> = ({ scrollable, variant = 'default', className = '', children }) => {
  return (
    <main className={cn(contentVariants({ scrollable, variant }), className)}>{children}</main>
  );
};
