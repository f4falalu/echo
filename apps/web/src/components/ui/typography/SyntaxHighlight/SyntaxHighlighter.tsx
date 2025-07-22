import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/classMerge';
import { getCodeTokens } from './shiki-instance';
import styles from './SyntaxHighlighter.module.css';
import { animations, type MarkdownAnimation } from '../animation-common';
import { Line } from './Line';

export const SyntaxHighlighter = (props: {
  children: string;
  language?: 'sql' | 'yaml';
  showLineNumbers?: boolean;
  startingLineNumber?: number;
  className?: string;
  customStyle?: React.CSSProperties;
  isDarkMode?: boolean;
  animation?: MarkdownAnimation;
  animationDuration?: number;
}) => {
  const {
    children,
    language = 'sql',
    showLineNumbers = false,
    startingLineNumber = 1,
    className = '',
    customStyle = {},
    isDarkMode = false,
    animation = 'none',
    animationDuration = 700
  } = props;

  const [tokens, setTokens] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track which lines have been rendered before
  const renderedLinesRef = useRef<Set<number>>(new Set());
  const previousLineCountRef = useRef(0);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const theme = isDarkMode ? 'buster-dark' : 'buster-light';
        const tokenData = await getCodeTokens(children, language, theme);

        // Check if content got shorter (lines were removed)
        const currentLineCount = tokenData.tokens.length;
        if (currentLineCount < previousLineCountRef.current) {
          renderedLinesRef.current.clear();
        }
        previousLineCountRef.current = currentLineCount;

        setTokens(tokenData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error tokenizing code:', error);
        setIsLoading(false);
      }
    };

    loadTokens();
  }, [children, language, isDarkMode]);

  if (isLoading || !tokens) {
    return (
      <div className={cn(styles.shikiContainer, className)} style={customStyle}>
        <pre>
          <code>{children}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={cn(styles.shikiContainer, className)} style={customStyle}>
      <div
        className={cn(
          styles.shikiWrapper,
          showLineNumbers && styles.withLineNumbers,
          animation !== 'none' && styles.animated,
          'overflow-x-auto'
        )}
        style={
          showLineNumbers && startingLineNumber !== 1
            ? ({
                '--line-number-start': startingLineNumber - 1
              } as React.CSSProperties)
            : undefined
        }>
        <pre style={{ background: tokens.bg, color: tokens.fg }}>
          <code>
            {tokens.tokens.map((line: any[], index: number) => {
              const isNewLine = !renderedLinesRef.current.has(index);
              if (isNewLine) {
                renderedLinesRef.current.add(index);
              }

              return (
                <Line
                  key={index}
                  tokens={line}
                  lineNumber={index + 1}
                  showLineNumber={showLineNumbers}
                  animation={animation !== 'none' ? animations[animation] : undefined}
                  animationDuration={animationDuration}
                  isNew={isNewLine}
                />
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};
