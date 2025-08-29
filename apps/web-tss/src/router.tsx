import type { User } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { createRouteMask, createRouter as createTanstackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import {
  LazyCatchErrorCard,
  LazyGlobalErrorCard,
} from '@/components/features/global/LazyGlobalErrorCard';
import { NotFoundCard } from '@/components/features/global/NotFoundCard';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import * as TanstackQuery from './integrations/tanstack-query/query-client';
import { routeTree } from './routeTree.gen';

export interface AppRouterContext {
  queryClient: QueryClient;
  user: User | null;
}

const metricChartEditToMetricChartMask = createRouteMask({
  routeTree,
  from: '/app/metrics/$metricId/chart/edit', // internal route you actually navigate to
  to: '/app/metrics/$metricId/chart', // URL shown in the bar/history
  params: true, // keep path/search/hash params in sync
});

// Create a new router instance
export const createRouter = () => {
  const queryClient = TanstackQuery.getQueryClient();

  const router = routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      routeMasks: [metricChartEditToMetricChartMask],
      context: { queryClient, user: null }, //context is defined in the root route
      scrollRestoration: true,
      defaultPreload: 'intent',
      defaultPendingComponent: FileIndeterminateLoader,
      defaultErrorComponent: LazyGlobalErrorCard,
      defaultNotFoundComponent: NotFoundCard,
      defaultOnCatch: LazyCatchErrorCard,
      Wrap: (props) => {
        return (
          <TanstackQuery.Provider queryClient={queryClient}>
            {props.children}
          </TanstackQuery.Provider>
        );
      },
    }),
    queryClient
  );

  return router;
};

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
