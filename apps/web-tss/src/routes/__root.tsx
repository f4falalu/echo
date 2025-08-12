import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { GlobalErrorCard } from '@/components/features/global/GlobalErrorCard';
import { NotFoundCard } from '@/components/features/global/NotFoundCard';
import { AppProviders } from '@/context/AppProviders';
import { getSupabaseUser } from '../integrations/supabase/getSupabaseUserContext';
import { TanstackDevtools } from '../integrations/tanstack-dev-tools/tanstack-devtools';
import type { AppRouterContext } from '../router';
import appCss from '../styles/styles.css?url';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Buster',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: NotFoundCard,
  shellComponent: RootDocument,
  errorComponent: GlobalErrorCard,
  beforeLoad: async () => {
    const supabaseConfig = await getSupabaseUser();
    return supabaseConfig;
  },
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppProviders accessToken={accessToken} user={user}>
          {children}
        </AppProviders>

        <TanstackDevtools />
        <Scripts />
      </body>
    </html>
  );
}
