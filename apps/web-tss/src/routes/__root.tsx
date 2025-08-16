import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { RootProviders } from '@/context/Providers';
import { getSupabaseUser } from '../integrations/supabase/getSupabaseUserServer';
import { TanstackDevtools } from '../integrations/tanstack-dev-tools/tanstack-devtools';
import type { AppRouterContext } from '../router';
import appCss from '../styles/styles.css?url';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Buster' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  beforeLoad: async () => {
    const supabaseConfig = await getSupabaseUser();
    return supabaseConfig;
  },
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user, accessToken, queryClient } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootProviders user={user} accessToken={accessToken} queryClient={queryClient}>
          {children}
        </RootProviders>
        <TanstackDevtools />
        <Scripts />
      </body>
    </html>
  );
}
