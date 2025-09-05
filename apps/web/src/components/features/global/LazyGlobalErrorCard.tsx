import type { ErrorRouteComponent } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState } from 'react';

// Lazy load the GlobalErrorCard component
const GlobalErrorCard = lazy(() =>
  import('./GlobalErrorCard').then((module) => ({
    default: module.GlobalErrorCard,
  }))
);

// Fallback component while loading
const ErrorLoadingFallback = () => <div />;

// Wrapper component that handles lazy loading with Suspense
export const LazyGlobalErrorCard: ErrorRouteComponent = (props) => {
  // Track if we're on the client side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set to true only after mount (client-side only)
    setIsClient(true);
  }, []);

  // During SSR, render the fallback directly to avoid hydration mismatch
  if (!isClient) {
    return <ErrorLoadingFallback />;
  }

  return (
    <Suspense fallback={<ErrorLoadingFallback />}>
      <GlobalErrorCard {...props} />
    </Suspense>
  );
};

export const LazyCatchErrorCard = (error: Error) => {
  return (
    <Suspense fallback={<ErrorLoadingFallback />}>
      <GlobalErrorCard error={error} reset={() => {}} />
    </Suspense>
  );
};
