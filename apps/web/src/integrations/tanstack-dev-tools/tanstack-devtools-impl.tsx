import { ClientOnly } from '@tanstack/react-router';
import React, { lazy, Suspense } from 'react';
import { useMount } from '@/hooks/useMount';
import { isServer } from '@/lib/window';

const isProduction = import.meta.env.PROD;

// Only create lazy components if we're in the browser
const LazyTanstackDevtools = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-devtools/production').then((mod) => ({
        default: mod.TanStackDevtools,
      }))
    )
  : () => null;

const LazyTanstackDevtoolsInProd = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-devtools/production').then((mod) => ({
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

const LazyReactQueryDevtoolsPanelInProd = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-query-devtools/production').then((mod) => ({
        default: mod.ReactQueryDevtoolsPanel,
      }))
    )
  : () => null;

const LazyTanStackRouterDevtoolsPanel = !import.meta.env.SSR
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: isProduction
          ? mod.TanStackRouterDevtoolsPanelInProd
          : mod.TanStackRouterDevtoolsPanel,
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
  useMount(() => {
    if (import.meta.env.PROD) console.log('🐓 Rendering TanstackDevtoolsImpl');
  });
  const isServerOrSSR = isServer && import.meta.env.SSR;

  const TanstackDevtools = isProduction ? LazyTanstackDevtoolsInProd : LazyTanstackDevtools;
  const ReactQueryDevtoolsPanel = isProduction
    ? LazyReactQueryDevtoolsPanelInProd
    : LazyReactQueryDevtoolsPanel;

  if (isServerOrSSR) {
    return null;
  }

  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <TanstackDevtools
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
                  <ReactQueryDevtoolsPanel />
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
