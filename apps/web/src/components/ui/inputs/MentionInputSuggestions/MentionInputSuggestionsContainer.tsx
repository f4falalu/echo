import type React from 'react';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/classMerge';

export const MentionInputSuggestionsContainer: React.FC<
  PropsWithChildren<{
    className?: string;
    style?: React.CSSProperties;
  }>
> = ({ children, className, style }) => {
  return (
    <div
      data-testid="mention-input-suggestions-container"
      className={cn('flex flex-col border rounded overflow-hidden', className)}
      style={style}
    >
      {children}
    </div>
  );
};
