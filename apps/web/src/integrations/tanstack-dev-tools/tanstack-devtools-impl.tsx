import { ClientOnly } from '@tanstack/react-router';
import React, { lazy, Suspense } from 'react';
import { isServer } from '@/lib/window';

// Only create lazy components if we're in the browser
const LazyTanstackDevtools = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-devtools').then((mod) => ({
        default: mod.TanStackDevtools,
      }))
    )
  : () => null;

const LazyReactQueryDevtoolsPanel = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtoolsPanel,
      }))
    )
  : () => null;

const LazyTanStackRouterDevtoolsPanel = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtoolsPanel,
      }))
    )
  : () => null;

const LazyMetricStoreDevtools = !import.meta.env.SSR
  ? lazy(() =>
      import('./metric-store-devtools').then((mod) => ({
        default: mod.default,
      }))
    )
  : () => null;

// The actual devtools component implementation
const TanstackDevtoolsImpl: React.FC = React.memo(() => {
  if (import.meta.env.SSR || isServer) {
    return null;
  } // never render on SSR

  console.log('🐓 Rendering TanstackDevtoolsImpl');

  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <LazyTanstackDevtools
          config={{
            position: 'bottom-left',
            hideUntilHover: true,
            defaultOpen: false,
          }}
          plugins={[
            {
              name: 'Tanstack Query',
              render: (
                <Suspense fallback={null}>
                  <LazyReactQueryDevtoolsPanel />
                </Suspense>
              ),
            },
            {
              name: 'Tanstack Router',
              render: (
                <Suspense fallback={null}>
                  <LazyTanStackRouterDevtoolsPanel />
                </Suspense>
              ),
            },
            {
              name: 'Metric Original Store',
              render: (
                <Suspense fallback={null}>
                  <LazyMetricStoreDevtools />
                </Suspense>
              ),
            },
          ]}
        />
      </Suspense>
    </ClientOnly>
  );
});

TanstackDevtoolsImpl.displayName = 'TanstackDevtoolsImpl';

export default TanstackDevtoolsImpl;
