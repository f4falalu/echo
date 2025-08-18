import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { RootProviders } from '@/context/Providers';
import shareImage from '../assets/png/default_preview.png';
import favicon from '../assets/png/favicon.ico';
import { getSupabaseUser } from '../integrations/supabase/getSupabaseUserServer';
import { TanstackDevtools } from '../integrations/tanstack-dev-tools/tanstack-devtools';
import type { AppRouterContext } from '../router';
import appCss from '../styles/styles.css?url';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { title: 'Buster' },
      { name: 'viewport', content: 'width=1024, initial-scale=1, user-scalable=no' },
      { name: 'description', content: 'Buster.so is the open source, AI-native data platform.' },
      { name: 'og:image', content: shareImage },
      { name: 'og:title', content: 'Buster' },
      { name: 'og:description', content: 'Buster.so is the open source, AI-native data platform.' },
      { name: 'og:url', content: 'https://buster.so' },
      { name: 'og:type', content: 'website' },
      { name: 'og:locale', content: 'en_US' },
      { name: 'og:site_name', content: 'Buster' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: favicon },
      { rel: 'apple-touch-icon', href: favicon },
      { rel: 'manifest', href: '/manifest.json' },
    ],
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
