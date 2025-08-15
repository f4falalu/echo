import type { User } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createRouter as createTanstackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import * as TanstackQuery from './integrations/tanstack-query/query-client';
import { routeTree } from './routeTree.gen';

export interface AppRouterContext {
  queryClient: QueryClient;
  user: User | null;
}

// Create a new router instance
export const createRouter = () => {
  const queryClient = TanstackQuery.getQueryClient();

  const router = routerWithQueryClient(
    createTanstackRouter({
      routeTree,
      context: { queryClient, user: null }, //context is defined in the root route
      scrollRestoration: true,
      defaultPreload: 'intent',
      defaultPendingComponent: () => <div>Loading...</div>,
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

  // setupRouterSsrQueryIntegration({
  //   router,
  //   queryClient,
  //   // Disable auto-wrapping since we'll handle it ourselves
  //   wrapQueryClient: false,
  // });

  return router;
};

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
