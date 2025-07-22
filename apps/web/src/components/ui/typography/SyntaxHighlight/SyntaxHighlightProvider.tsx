import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeHighlighter } from './shiki-instance';

interface SyntaxHighlightContextValue {
  isReady: boolean;
  error: Error | null;
}

const SyntaxHighlightContext = createContext<SyntaxHighlightContextValue>({
  isReady: false,
  error: null
});

export const useSyntaxHighlight = () => {
  const context = useContext(SyntaxHighlightContext);
  if (!context) {
    throw new Error('useSyntaxHighlight must be used within SyntaxHighlightProvider');
  }
  return context;
};

interface SyntaxHighlightProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that pre-initializes the syntax highlighter instance.
 * This ensures the highlighter is ready before any SyntaxHighlighter components render,
 * reducing loading states and improving performance.
 */
export const SyntaxHighlightProvider: React.FC<SyntaxHighlightProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize the highlighter on mount
    initializeHighlighter()
      .then(() => {
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize syntax highlighter:', err);
        setError(err);
        // Still mark as ready so components can fall back gracefully
        setIsReady(true);
      });
  }, []);

  return (
    <SyntaxHighlightContext.Provider value={{ isReady, error }}>
      {children}
    </SyntaxHighlightContext.Provider>
  );
};
