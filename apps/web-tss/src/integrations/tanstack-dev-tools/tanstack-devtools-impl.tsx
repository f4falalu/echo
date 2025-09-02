import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

//import StoreDevtools from './metric-store-devtools';

const LazyTanstackDevtools = lazy(() =>
  import('@tanstack/react-devtools').then((mod) => ({
    default: mod.TanStackDevtools,
  }))
);

const LazyReactQueryDevtoolsPanel = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtoolsPanel,
  }))
);

const LazyTanStackRouterDevtoolsPanel = lazy(() =>
  import('@tanstack/react-router-devtools').then((mod) => ({
    default: mod.TanStackRouterDevtoolsPanel,
  }))
);

const LazyMetricStoreDevtools = lazy(() =>
  import('./metric-store-devtools').then((mod) => ({
    default: mod.default,
  }))
);

// The actual devtools component implementation
const TanstackDevtoolsImpl: React.FC = () => {
  if (import.meta.env.SSR) return null; // never render on SSR

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
};

export default TanstackDevtoolsImpl;
