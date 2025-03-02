import { useBusterNotifications } from '@/context/BusterNotifications';
import { createStyles } from 'antd-style';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from 'ahooks';
import { Button } from '@/components/ui/buttons';
import { Copy } from '@/components/ui/icons';

export const AppCodeBlockWrapper: React.FC<{
  children: React.ReactNode;
  code?: string;
  language?: string;
  showCopyButton?: boolean;
  buttons?: React.ReactNode;
  title?: string | React.ReactNode;
}> = React.memo(({ children, code, showCopyButton = true, language, buttons, title }) => {
  const { cx, styles } = useStyles();
  const { openSuccessMessage } = useBusterNotifications();

  const copyCode = useMemoizedFn(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    openSuccessMessage('Copied to clipboard');
  });

  return (
    <div className={cx(styles.container, 'max-h-fit')}>
      <div className={cx(styles.containerHeader, 'flex items-center justify-between')}>
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

const useStyles = createStyles(({ token }) => ({
  container: {
    backgroundColor: token.colorBgBase,
    margin: `0px 0px`,
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: `${token.borderRadiusLG}px`,
    overflow: 'hidden'
  },
  containerHeader: {
    borderBottom: `0.5px solid ${token.colorBorder}`,
    padding: '4px',
    backgroundColor: token.controlItemBgActive,
    height: '32px',
    minHeight: '32px',
    maxHeight: '32px'
  }
}));
