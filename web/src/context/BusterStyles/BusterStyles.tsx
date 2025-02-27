'use client';

import 'react-material-symbols/rounded';
import React, { PropsWithChildren } from 'react';
import { usePreventBackwardNavigation } from '@/hooks/dom/usePreventBackwardsNavigation';
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';
import {
  useContextSelector,
  createContext,
  ContextSelector
} from '@fluentui/react-context-selector';
import { Toaster } from '@/components/ui/toaster';

export const ENABLE_DARK_MODE = false;

const BaseBusterStyleProvider: React.FC<PropsWithChildren<{}>> = React.memo(({ children }) => {
  usePreventBackwardNavigation();

  const nextThemeMode = useNextTheme();
  const isDarkMode =
    ENABLE_DARK_MODE && (nextThemeMode.theme === 'dark' || nextThemeMode.resolvedTheme === 'dark');

  return <BusterStyles.Provider value={{ isDarkMode }}>{children}</BusterStyles.Provider>;
});
BaseBusterStyleProvider.displayName = 'BusterStyleProvider';

export const BusterStyleProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={ENABLE_DARK_MODE}
      themes={['light', 'dark']}
      disableTransitionOnChange>
      <BaseBusterStyleProvider>
        {children}
        <Toaster />
      </BaseBusterStyleProvider>
    </NextThemeProvider>
  );
};

const BusterStyles = createContext<{ isDarkMode: boolean }>({
  isDarkMode: false
});

export const useBusterStylesContext = <T,>(
  selector: ContextSelector<{ isDarkMode: boolean }, T>
) => {
  return useContextSelector(BusterStyles, selector);
};
