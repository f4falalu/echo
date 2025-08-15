import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { LazyGlobalErrorCard } from '@/components/features/global/LazyGlobalErrorCard';
import { NotFoundCard } from '@/components/features/global/NotFoundCard';
import { RootProviders } from '@/context/Providers';
import { getSupabaseUser } from '../integrations/supabase/getSupabaseUserServer';
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
  errorComponent: LazyGlobalErrorCard,
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
        <RootProviders user={user} accessToken={accessToken}>
          {children}
        </RootProviders>
        <TanstackDevtools />
        <Scripts />
      </body>
    </html>
  );
}
