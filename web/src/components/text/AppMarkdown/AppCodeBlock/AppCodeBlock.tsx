import React, { useLayoutEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { createStyles } from 'antd-style';
import darkTheme from 'react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus';
import { TextPulseLoader } from '../../..';
import lightTheme from './light';
import { useBusterStylesContext } from '@/context/BusterStyles/BusterStyles';
import { AppCodeBlockWrapper } from './AppCodeBlockWrapper';

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
  const isDarkMode = useBusterStylesContext((state) => state.isDarkMode);
  const { children, className = '', language, showLoader, showCopyButton = true, ...rest } = props;
  const [style, setStyle] = useState<{
    [key: string]: React.CSSProperties;
  }>(lightTheme);
  const code = String(children).replace(/\n$/, '');

  useLayoutEffect(() => {
    const theme = isDarkMode ? darkTheme : lightTheme;
    setStyle(theme);
  }, [isDarkMode]);

  //this is a huge assumption, but if there is no language, it is probably an inline code block
  if (!language) {
    return <CodeInlineWrapper>{children}</CodeInlineWrapper>;
  }

  return (
    <AppCodeBlockWrapper
      code={code}
      isDarkMode={isDarkMode}
      language={title || language}
      showCopyButton={showCopyButton}>
      <div className="w-full overflow-x-auto">
        <div className="code-wrapper">
          {language ? (
            <SyntaxHighlighter
              {...rest}
              className={`${className} !p-3 transition ${!style ? 'opacity-100' : '!m-0 !border-none !p-0 opacity-100'}`}
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

const useStyles = createStyles(({ token }) => ({
  codeInlineWrapper: {
    backgroundColor: token.controlItemBgActive,
    borderRadius: token.borderRadiusSM,
    border: `0.5px solid ${token.colorBorder}`,
    fontSize: token.fontSize - 1
  }
}));

const CodeInlineWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { cx, styles } = useStyles();
  return <code className={cx(styles.codeInlineWrapper, 'px-1')}>{children}</code>;
};
