import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { isServer } from '@/lib/window';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

// Define theme types
export type Theme = 'dark' | 'light' | 'system';

// Theme provider state type
export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isLight: boolean;
  systemTheme: 'dark' | 'light';
};

// Theme provider props
type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

// Create the context
const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

const ENABLED_DARK_MODE = false;

// Theme provider component
export function BusterThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'buster-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useLocalStorageState<Theme>(storageKey, {
    defaultValue: defaultTheme,
  });

  // Track system preference
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => {
    if (!isServer) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Calculate actual theme (resolving 'system' to actual value)
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';

  // Apply theme to document root
  useEffect(() => {
    if (!ENABLED_DARK_MODE) return;

    const root = window.document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Add the appropriate class
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Theme setter that persists to localStorage
  const setTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
    },
    [storageKey, setThemeState]
  );

  // Context value
  const value: ThemeProviderState = useMemo(
    () => ({
      theme,
      setTheme,
      isDark,
      isLight,
      systemTheme,
    }),
    [theme, setTheme, isDark, isLight, systemTheme]
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

// Selector hook with type safety
export function useBusterTheme<T>(selector: (state: ThemeProviderState) => T): T {
  return useContextSelector(ThemeProviderContext, (state) => {
    if (!state) {
      throw new Error('useBusterTheme must be used within a BusterThemeProvider');
    }
    return selector(state);
  });
}

const selectTheme = (state: ThemeProviderState) => state.theme;
const selectSetTheme = (state: ThemeProviderState) => state.setTheme;
const selectIsDark = (state: ThemeProviderState) => state.isDark;
const selectIsLight = (state: ThemeProviderState) => state.isLight;
const selectSystemTheme = (state: ThemeProviderState) => state.systemTheme;
const selectThemeState = (state: ThemeProviderState) => state;

export const useTheme = () => useBusterTheme(selectTheme);
export const useSetTheme = () => useBusterTheme(selectSetTheme);
export const useIsDarkTheme = () => useBusterTheme(selectIsDark);
export const useIsLightTheme = () => useBusterTheme(selectIsLight);
export const useSystemTheme = () => useBusterTheme(selectSystemTheme);
export const useThemeState = () => useBusterTheme(selectThemeState);
