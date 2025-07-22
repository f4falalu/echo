import { useState, useLayoutEffect } from 'react';
import type { ThemedToken } from 'shiki';
import { getCodeTokens } from './shiki-instance';

// Type for token data
export type TokenData = {
  tokens: ThemedToken[][];
  bg: string;
  fg: string;
};

// Custom hook to handle token loading
export const useCodeTokens = (code: string, language: 'sql' | 'yaml', isDarkMode: boolean) => {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
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
