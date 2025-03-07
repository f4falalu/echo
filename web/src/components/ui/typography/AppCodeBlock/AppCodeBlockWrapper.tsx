import { useBusterNotifications } from '@/context/BusterNotifications';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons';
import { Copy } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';

export const AppCodeBlockWrapper: React.FC<{
  children: React.ReactNode;
  code?: string;
  language?: string;
  showCopyButton?: boolean;
  buttons?: React.ReactNode;
  title?: string | React.ReactNode;
}> = React.memo(({ children, code, showCopyButton = true, language, buttons, title }) => {
  const { openSuccessMessage } = useBusterNotifications();

  const copyCode = useMemoizedFn(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    openSuccessMessage('Copied to clipboard');
  });

  return (
    <div className={cn('overflow-hidden rounded border', 'max-h-fit')}>
      <div
        className={cn(
          'bg-item-active border-border max-h-[32px] min-h-[32px] border-b p-1',
          'flex items-center justify-between'
        )}>
        <Text className="pl-2">{title || language}</Text>
        <div className="flex items-center space-x-1">
          {showCopyButton && (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyCode();
              }}
              prefix={<Copy />}>
              Copy
            </Button>
          )}
          {buttons}
        </div>
      </div>

      {children}
    </div>
  );
});
AppCodeBlockWrapper.displayName = 'CodeBlockWrapper';
