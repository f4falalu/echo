import type { ErrorRouteComponent } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

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
  return (
    <Suspense fallback={<ErrorLoadingFallback />}>
      <GlobalErrorCard {...props} />
    </Suspense>
  );
};
