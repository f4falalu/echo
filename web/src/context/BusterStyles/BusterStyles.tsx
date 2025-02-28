import 'react-material-symbols/rounded';
import React, { PropsWithChildren } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { BusterNotificationsProvider } from '../BusterNotifications';

const ENABLE_DARK_MODE = false;

export const BusterStyleProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={ENABLE_DARK_MODE}
      themes={['light', 'dark']}
      disableTransitionOnChange>
      <BusterNotificationsProvider>{children}</BusterNotificationsProvider>
    </NextThemeProvider>
  );
};
