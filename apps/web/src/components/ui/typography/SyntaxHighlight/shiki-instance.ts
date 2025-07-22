import { createHighlighterCore, HighlighterCore } from 'shiki/core';
import type { ShikiTransformer } from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import githubLight from '@shikijs/themes/github-light';
import githubDark from '@shikijs/themes/github-dark';

// Singleton instance
let highlighterInstance: HighlighterCore | null = null;
let initializationPromise: Promise<HighlighterCore> | null = null;

// Initialize the highlighter with pre-loaded languages and themes
export const initializeHighlighter = async (): Promise<HighlighterCore> => {
  // Return existing instance if available
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Return ongoing initialization if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [() => import('@shikijs/langs/sql'), () => import('@shikijs/langs/yaml')],
    engine: createOnigurumaEngine(import('shiki/wasm'))
  });

  try {
    highlighterInstance = await initializationPromise;
    return highlighterInstance;
  } catch (error) {
    // Reset on error so it can be retried
    initializationPromise = null;
    throw error;
  }
};

// Highlight code
export const highlightCode = async (
  code: string,
  language: 'sql' | 'yaml',
  theme: 'github-light' | 'github-dark',
  transformers?: ShikiTransformer[]
): Promise<string> => {
  // Get or initialize highlighter
  const highlighter = await initializeHighlighter();

  // Generate highlighted HTML
  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme,
    transformers
  });

  return html;
};

// Get tokens for code
export const getCodeTokens = async (
  code: string,
  language: 'sql' | 'yaml',
  theme: 'github-light' | 'github-dark'
): Promise<any> => {
  const highlighter = await initializeHighlighter();
  const tokens = highlighter.codeToTokens(code, {
    lang: language,
    theme
  });

  return tokens;
};

// Pre-initialize highlighter on module load for better performance
if (typeof window !== 'undefined') {
  initializeHighlighter().catch((error) => {
    console.warn('Failed to pre-initialize syntax highlighter:', error);
  });
}
