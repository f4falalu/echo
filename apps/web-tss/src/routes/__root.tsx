import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { AppProviders } from '@/context/AppProviders';
import { BusterStyleProvider } from '@/context/BusterStyles';
import Header from '../components/Header';
import { getSupabaseUser } from '../integrations/supabase/getSupabaseUserContext';
import { TanstackDevtools } from '../integrations/tanstack-dev-tools/tanstack-devtools';
import type { AppRouterContext } from '../router';
import appCss from '../styles.css?url';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        title: 'Buster'
      }
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss
      }
    ]
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
  beforeLoad: async () => {
    const supabaseConfig = await getSupabaseUser();
    return supabaseConfig;
  }
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
          <Header />
          {user ? <div>Logged in as {user.email}</div> : <div>Logged out</div>}
          {children}
        </AppProviders>

        <TanstackDevtools />
        <Scripts />
      </body>
    </html>
  );
}

// Default 404 component rendered when a route is not found
function NotFound() {
  return (
    <div className="m-8 flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Go back home
      </Link>
    </div>
  );
}
