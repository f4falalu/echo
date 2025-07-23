import { cn } from '@/lib/classMerge';
import type { PropsWithChildren } from 'react';

export const Text: React.FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className
}) => {
  return <span className={cn('text-text-default text-base', className)}>{children}</span>;
};
