import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { TextPulseLoader } from '../..';
import lightTheme from './light';
import { AppCodeBlockWrapper } from './AppCodeBlockWrapper';
import { cn } from '@/lib/classMerge';

export const AppCodeBlock: React.FC<{
  language?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  showLoader?: boolean;
  showCopyButton?: boolean;
  title?: string;
  buttons?: React.ReactNode;
}> = React.memo(({ title, buttons, ...props }) => {
  const { children, className = '', language, showLoader, showCopyButton = true, ...rest } = props;
  const [style, setStyle] = useState<{
    [key: string]: React.CSSProperties;
  }>(lightTheme);
  const code = String(children).replace(/\n$/, '');

  //this is a huge assumption, but if there is no language, it is probably an inline code block
  if (!language) {
    return <CodeInlineWrapper>{children}</CodeInlineWrapper>;
  }

  return (
    <AppCodeBlockWrapper code={code} language={title || language} showCopyButton={showCopyButton}>
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

          {showLoader && (
            <div className="-mt-2 pl-3">
              <TextPulseLoader />
            </div>
          )}
        </div>
      </div>
    </AppCodeBlockWrapper>
  );
});
AppCodeBlock.displayName = 'AppCodeBlock';

const CodeInlineWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <code className={cn('bg-item-active rounded-sm border text-sm', 'px-1')}>{children}</code>;
};
