import React from 'react';
import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons/Button';
import { Card, CardHeader, CardContent } from './CardBase';
import { Download, Copy } from '../icons';
import { ErrorClosableContainer } from '../error/ErrorClosableContainer';

export const CodeCard: React.FC<{
  code: string;
  language: string;
  fileName: string;
  className?: string;
  bodyClassName?: string;
  error?: string;
  buttons?: React.ReactNode | true;
  onChange?: (code: string) => void;
  readOnly?: boolean;
  onMetaEnter?: () => void;
}> = React.memo(
  ({
    code,
    onMetaEnter,
    language = 'yml',
    fileName,
    className = 'h-full overflow-hidden',
    bodyClassName = 'h-full',
    buttons = true,
    onChange,
    readOnly = false,
    error = ''
  }) => {
    const ShownButtons =
      buttons === true ? (
        <CardButtons fileName={fileName} code={code} language={language} />
      ) : (
        buttons
      );

    return (
      <Card className={cn('h-full', className)}>
        <CardHeader variant={'gray'} size={'xsmall'} className="justify-center">
          <div className="flex items-center justify-between gap-x-1">
            <span className="truncate text-base">{fileName}</span>
            {ShownButtons}
          </div>
        </CardHeader>
        <CardContent className={cn('bg-background overflow-hidden p-0', bodyClassName)}>
          <div className={cn('bg-background relative', bodyClassName)}>
            <AppCodeEditor
              language={language}
              value={code}
              onChange={onChange}
              readOnly={readOnly}
              height="100%"
              onMetaEnter={onMetaEnter}
              className="border-none"
            />
            {error && <ErrorClosableContainer error={error} className="bottom-10!" />}
          </div>
        </CardContent>
      </Card>
    );
  }
);
CodeCard.displayName = 'CodeCard';

const CardButtons: React.FC<{
  fileName: string;
  code: string;
  language: string;
}> = React.memo(({ fileName, code, language }) => {
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
      link.download = `${fileName}.${language}`; //this is actually not a good idea...
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
      <Button variant="ghost" prefix={<Copy />} onClick={handleCopyCode} title="Copy code" />
      <Button
        variant="ghost"
        prefix={<Download />}
        onClick={handleDownload}
        title="Download file"
      />
    </div>
  );
});
CardButtons.displayName = 'CardButtons';
