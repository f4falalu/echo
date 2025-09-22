import type React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useIsVersionChanged } from '@/context/AppVersion/useAppVersion';
import { ErrorCard } from './GlobalErrorCard';

export const LazyErrorBoundary: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isChanged = useIsVersionChanged();
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        console.log(isChanged);
        console.log(error);
        return (
          <ErrorCard
            header="Oops, something went wrong"
            message="Our team has been notified via Slack. We'll take a look at the issue ASAP and get back to you."
          />
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
