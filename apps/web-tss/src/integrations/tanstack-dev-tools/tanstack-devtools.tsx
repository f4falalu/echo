import { ClientOnly } from '@tanstack/react-router';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { isDev } from '@/config/dev';
import { isServer } from '@/lib/window';

const ENABLE_TANSTACK_PANEL =
  (process.env.VITE_ENABLE_TANSTACK_PANEL === 'true' || isDev) && !isServer;

// Lazy load the actual devtools component
// const LazyTanstackDevtools = lazy(() =>
//   import('./tanstack-devtools-impl').then((mod) => ({
//     default: mod.default,
//   }))
// );

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

  if (!ENABLE_TANSTACK_PANEL || !mounted || !useDevTools) {
    return null;
  }

  return (
    <ClientOnly>
      <div>SWAG</div>
      {/* <Suspense fallback={null}>
        <LazyTanstackDevtools />
      </Suspense> */}
    </ClientOnly>
  );
});

TanstackDevtools.displayName = 'TanstackDevtools';
