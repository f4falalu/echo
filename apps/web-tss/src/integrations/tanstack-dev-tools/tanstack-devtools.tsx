import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { isDev } from '@/config/dev';

const ENABLE_TANSTACK_PANEL = process.env.VITE_ENABLE_TANSTACK_PANEL === 'true' || isDev;

// Lazy load the actual devtools component
const LazyTanstackDevtools = lazy(() =>
  import('./tanstack-devtools-impl').then((mod) => ({
    default: mod.default,
  }))
);

// Export component with Suspense wrapper
export const TanstackDevtools: React.FC = React.memo(() => {
  // Track if we're on the client side
  const [mounted, setMounted] = useState(false);
  const [useDevTools, setUseDevTools] = useState(import.meta.env.DEV);

  useEffect(() => {
    // Set to true only after mount (client-side only)
    setMounted(true);
  }, []);

  useHotkeys(
    'shift+a',
    () => {
      setUseDevTools(true);
    },
    { enabled: ENABLE_TANSTACK_PANEL }
  );

  // Only render in development and on the client
  if (!mounted || !useDevTools) {
    return null;
  }

  if (!ENABLE_TANSTACK_PANEL) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LazyTanstackDevtools />
    </Suspense>
  );
});

TanstackDevtools.displayName = 'TanstackDevtools';
