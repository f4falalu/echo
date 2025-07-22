'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/classMerge';
import { getCodeTokens } from './shiki-instance';
import styles from './SyntaxHighlighter.module.css';
import { animations, type MarkdownAnimation } from '../animation-common';
import type { ThemedToken } from 'shiki';

export const SyntaxHighlighter = (props: {
  children: string;
  language?: 'sql' | 'yaml';
  showLineNumbers?: boolean;
  startingLineNumber?: number;
  className?: string;
  containerClassName?: string;
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
    containerClassName = '',
    customStyle = {},
    isDarkMode = false,
    animation = 'none',
    animationDuration = 700
  } = props;

  const [tokens, setTokens] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const theme = isDarkMode ? 'github-dark' : 'github-light';
        const tokenData = await getCodeTokens(children, language, theme);

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
      <div
        className={cn(styles.shikiContainer, containerClassName, 'invisible')}
        style={customStyle}>
        <pre>
          <code>{children}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={cn(styles.shikiContainer, containerClassName)} style={customStyle}>
      <div
        className={cn(
          styles.shikiWrapper,
          showLineNumbers && styles.withLineNumbers,
          animation !== 'none' && styles.animated,
          'overflow-x-auto',
          className
        )}
        style={{
          background: tokens.bg,
          color: tokens.fg,
          ...(showLineNumbers && startingLineNumber !== 1
            ? ({
                '--line-number-start': startingLineNumber - 1
              } as React.CSSProperties)
            : undefined)
        }}>
        <pre>
          <code>
            {tokens.tokens.map((line: any[], index: number) => {
              return (
                <Line
                  key={index}
                  tokens={line}
                  lineNumber={index + 1}
                  animation={animation !== 'none' ? animations[animation] : undefined}
                  animationDuration={animationDuration}
                />
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Line component for rendering individual lines with animation support
interface LineProps {
  tokens: ThemedToken[];
  lineNumber: number;
  animation?: string;
  animationDuration?: number;
}

const Line: React.FC<LineProps> = React.memo(
  ({ tokens, animation, lineNumber, animationDuration = 700 }) => {
    const lineStyle =
      animation && animation !== 'none'
        ? { animation: `${animation} ${animationDuration}ms ease-in-out forwards` }
        : undefined;

    return (
      <div className={styles.line} style={lineStyle} data-line-number={lineNumber}>
        {tokens.map((token, index) => (
          <span key={index} style={{ color: token.color }}>
            {token.content}
          </span>
        ))}
      </div>
    );
  }
);

Line.displayName = 'Line';
