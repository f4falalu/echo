'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import lightTheme from './light';
import { cn } from '@/lib/classMerge';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { FileCard } from '../../card/FileCard';
import { Button } from '../../buttons';
import { Copy } from '../../icons';

export const AppCodeBlock: React.FC<{
  language?: string;
  className?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  showCopyButton?: boolean;
  title?: string;
  buttons?: React.ReactNode;
  showLoader?: boolean;
}> = React.memo(({ title, buttons, showLoader, ...props }) => {
  const {
    children,
    className = '',
    wrapperClassName = '',
    language,
    showCopyButton = true,
    ...rest
  } = props;
  const style = lightTheme;
  const code = String(children).replace(/\n$/, '');
  const { openSuccessMessage } = useBusterNotifications();

  const copyCode = useMemoizedFn(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    openSuccessMessage('Copied to clipboard');
  });

  //this is a huge assumption, but if there is no language, it is probably an inline code block
  if (!language) {
    return <CodeInlineWrapper>{children}</CodeInlineWrapper>;
  }

  return (
    <FileCard
      fileName={title || language}
      className={wrapperClassName}
      headerButtons={
        showCopyButton && (
          <Button variant="ghost" onClick={copyCode} prefix={<Copy />}>
            Copy
          </Button>
        )
      }>
      <div className="w-full overflow-x-auto">
        <div className="code-wrapper">
          {language ? (
            <SyntaxHighlighter
              {...rest}
              className={`${className} p-3! transition ${!style ? 'opacity-100' : 'm-0! border-none! p-0! opacity-100'}`}
              language={language}
              style={style}>
              {code}
            </SyntaxHighlighter>
          ) : (
            <code {...rest} className={className}>
              {children}
            </code>
          )}
        </div>
      </div>
    </FileCard>
  );
});
AppCodeBlock.displayName = 'AppCodeBlock';

const CodeInlineWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <code className={cn('bg-item-active rounded-sm border text-sm', 'px-1')}>{children}</code>;
};

const PulseLoader = React.memo(({ className, size = 4 }: { className?: string; size?: number }) => {
  return (
    <span
      className={cn(className)}
      style={{
        opacity: 0.6,
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: 'var(--color-text-default)',
        borderRadius: '100%'
      }}>
      {/* Pulse animation can be added here if needed */}
    </span>
  );
});
PulseLoader.displayName = 'PulseLoader';
