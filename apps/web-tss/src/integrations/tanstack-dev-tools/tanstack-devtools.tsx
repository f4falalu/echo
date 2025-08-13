import type React from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

// Lazy load the actual devtools component
const LazyTanstackDevtools = lazy(() =>
  import('./tanstack-devtools-impl').then((mod) => ({
    default: mod.default,
  }))
);

// Export component with Suspense wrapper
export const TanstackDevtools: React.FC = () => {
  // Track if we're on the client side
  const [mounted, setMounted] = useState(false);
  const [useDevTools, setUseDevTools] = useState(false);

  useEffect(() => {
    // Set to true only after mount (client-side only)
    setMounted(true);
  }, []);

  useHotkeys('shift+alt+d', () => {
    setUseDevTools(true);
  });

  // Only render in development and on the client
  if (!mounted || !useDevTools) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LazyTanstackDevtools />
    </Suspense>
  );
};
