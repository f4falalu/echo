import type React from 'react';
import type { PropsWithChildren } from 'react';
import { BusterNotificationsProvider } from '../BusterNotifications/BusterNotifications';
import { BusterThemeProvider } from './BusterThemeProvider';

// const ENABLE_DARK_MODE = false;

export const BusterStyleProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <BusterThemeProvider>
      <BusterNotificationsProvider>{children}</BusterNotificationsProvider>
    </BusterThemeProvider>
  );
};
