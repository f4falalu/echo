'use client';

import { cn } from '@/lib/utils';

import { ThemesStyle } from './ThemeStyles';
import { DEFAULT_THEME_STYLE } from './themes';

interface ThemeWrapperProps extends React.ComponentProps<'div'> {
  defaultTheme?: string;
}

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
