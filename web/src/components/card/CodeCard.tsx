import { createStyles } from 'antd-style';
import React from 'react';
import { Text } from '@/components/text';
import { AppCodeEditor } from '../inputs/AppCodeEditor';
import { Button } from 'antd';
import { AppMaterialIcons } from '../icons';
import { useMemoizedFn } from 'ahooks';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const CodeCard: React.FC<{
  code: string;
  language: string;
  fileName: string;
  className?: string;
  bodyClassName?: string;
  buttons?: React.ReactNode | true;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  onMetaEnter?: () => void;
}> = ({
  code,
  onMetaEnter,
  language = 'yml',
  fileName,
  className = 'h-full overflow-hidden',
  bodyClassName = 'h-full',
  buttons = true,
  onChange,
  readOnly = false
}) => {
  const { styles, cx } = useStyles();

  const ShownButtons = buttons === true ? <CardButtons fileName={fileName} code={code} /> : buttons;

  return (
    <div className={cx(styles.container, className)}>
      <div
        className={cx(
          styles.containerHeader,
          'flex items-center justify-between space-x-1 px-2.5'
        )}>
        <Text className="truncate">{fileName}</Text>

        {ShownButtons}
      </div>
      <div className={cx(styles.containerBody, bodyClassName)}>
        <AppCodeEditor
          language={language}
          value={code}
          onChange={onChange}
          readOnly={readOnly}
          height="100%"
          onMetaEnter={onMetaEnter}
        />
      </div>
    </div>
  );
};

const CardButtons: React.FC<{
  fileName: string;
  code: string;
}> = React.memo(({ fileName, code }) => {
  const { openInfoMessage, openErrorMessage } = useBusterNotifications();

  const handleCopyCode = useMemoizedFn(async () => {
    try {
      await navigator.clipboard.writeText(code);
      openInfoMessage('Code copied to clipboard');
    } catch (error) {
      openErrorMessage('Failed to copy code');
    }
  });

  const handleDownload = useMemoizedFn(() => {
    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      openErrorMessage('Failed to download file');
    }
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        type="text"
        icon={<AppMaterialIcons icon="content_copy" />}
        onClick={handleCopyCode}
        title="Copy code"
      />
      <Button
        type="text"
        icon={<AppMaterialIcons icon="download" />}
        onClick={handleDownload}
        title="Download file"
      />
    </div>
  );
});
CardButtons.displayName = 'CardButtons';

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};
  `,
  containerHeader: css`
    background: ${token.controlItemBgActive};
    border-bottom: 0.5px solid ${token.colorBorder};
    height: 32px;
  `,
  containerBody: css`
    background: ${token.colorBgBase};
  `
}));
