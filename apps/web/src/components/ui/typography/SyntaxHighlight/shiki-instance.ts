import { createHighlighterCore, HighlighterCore } from 'shiki/core';
import type { ShikiTransformer } from 'shiki';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import githubLight from '@shikijs/themes/github-light';
import githubDark from '@shikijs/themes/github-dark';

// Singleton instance
let highlighterInstance: HighlighterCore | null = null;
let initializationPromise: Promise<HighlighterCore> | null = null;

// Cache for highlighted code
const highlightCache = new Map<string, string>();

// Generate cache key
const getCacheKey = (code: string, language: string, theme: string): string => {
  return `${language}:${theme}:${code}`;
};

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

// Highlight code with caching
export const highlightCode = async (
  code: string,
  language: 'sql' | 'yaml',
  theme: 'github-light' | 'github-dark',
  transformers?: ShikiTransformer[]
): Promise<string> => {
  // Check cache first
  const cacheKey = getCacheKey(code, language, theme);
  const cached = highlightCache.get(cacheKey);
  if (cached && !transformers?.length) {
    return cached;
  }

  // Get or initialize highlighter
  const highlighter = await initializeHighlighter();

  // Generate highlighted HTML
  const html = highlighter.codeToHtml(code, {
    lang: language,
    theme,
    transformers
  });

  // Cache if no transformers (transformers might add dynamic content like line numbers)
  if (!transformers?.length) {
    highlightCache.set(cacheKey, html);
  }

  return html;
};

// Get tokens for code with caching
const tokenCache = new Map<string, any>();

export const getCodeTokens = async (
  code: string,
  language: 'sql' | 'yaml',
  theme: 'buster-light' | 'buster-dark'
): Promise<any> => {
  const cacheKey = getCacheKey(code, language, theme);
  const cached = tokenCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const highlighter = await initializeHighlighter();
  const tokens = highlighter.codeToTokens(code, {
    lang: language,
    theme
  });

  tokenCache.set(cacheKey, tokens);
  return tokens;
};

// Clear cache (useful for memory management if needed)
export const clearHighlightCache = (): void => {
  highlightCache.clear();
  tokenCache.clear();
};

// Pre-initialize highlighter on module load for better performance
if (typeof window !== 'undefined') {
  initializeHighlighter().catch((error) => {
    console.warn('Failed to pre-initialize syntax highlighter:', error);
  });
}
