'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/classMerge';
import { getCodeTokens } from './shiki-instance';
import styles from './SyntaxHighlighter.module.css';
import { animations, type MarkdownAnimation } from '../animation-common';
import type { ThemedToken } from 'shiki';

// Type for token data
type TokenData = {
  tokens: ThemedToken[][];
  bg: string;
  fg: string;
};

// Custom hook to handle token loading
const useCodeTokens = (code: string, language: 'sql' | 'yaml', isDarkMode: boolean) => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTokens = () => {
      try {
        const theme = isDarkMode ? 'github-dark' : 'github-light';
        getCodeTokens(code, language, theme).then((data) => {
          if (!cancelled) {
            setTokens(data);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error tokenizing code:', error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTokens();

    return () => {
      cancelled = true;
    };
  }, [code, language, isDarkMode]);

  return { tokens, isLoading };
};

export const SyntaxHighlighter = React.memo(
  (props: {
    children: string;
    language?: 'sql' | 'yaml';
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    className?: string;
    containerClassName?: string;
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
      isDarkMode = false,
      animation = 'none',
      animationDuration = 700
    } = props;

    const { tokens, isLoading } = useCodeTokens(children, language, isDarkMode);

    if (isLoading || !tokens) {
      return (
        <div className={cn(styles.shikiContainer, containerClassName, 'invisible')}>
          <pre>
            <code lang={language}>{children}</code>
          </pre>
        </div>
      );
    }

    return (
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
            {tokens.tokens.map((line: ThemedToken[], index: number) => {
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
    );
  }
);

SyntaxHighlighter.displayName = 'SyntaxHighlighter';

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
