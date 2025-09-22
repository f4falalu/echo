import type React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useIsVersionChanged } from '@/context/AppVersion/useAppVersion';
import { ErrorCard } from './GlobalErrorCard';

export const LazyErrorCard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isChanged = useIsVersionChanged();
  return <ErrorBoundary fallbackRender={() => <ErrorCard />}>{children}</ErrorBoundary>;
};
