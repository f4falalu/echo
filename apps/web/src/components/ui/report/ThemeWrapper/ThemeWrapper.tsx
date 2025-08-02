'use client';

import { cn } from '@/lib/utils';

import { ThemesStyle } from './ThemeStyles';
import { FONT_BASE_THEME, DEFAULT_COLOR_THEME } from './themes';

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
  defaultTheme?: string;
}

const DEFAULT_THEME_STYLE = {
  ...DEFAULT_COLOR_THEME,
  ...FONT_BASE_THEME,
  fontFamily: 'var(--font-sans), "Inter", sans-serif',
  fontSynthesisWeight: 'normal' as 'none',
  fontVariationSettings: 'normal'
} as React.CSSProperties;

export function ThemeWrapper({ children, className, defaultTheme }: ThemeWrapperProps) {
  return (
    <>
      <div
        style={DEFAULT_THEME_STYLE}
        className={cn('themes-wrapper w-full antialiased', className)}>
        {children}
      </div>

      <ThemesStyle />
    </>
  );
}
