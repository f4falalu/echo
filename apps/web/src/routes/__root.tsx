import { createRootRouteWithContext, HeadContent, Link, Scripts } from '@tanstack/react-router';
import { RootProviders } from '@/context/Providers';
import shareImage from '../assets/png/default_preview.png';
import favicon from '../assets/png/favicon.ico';
import { TanstackDevtools } from '../integrations/tanstack-dev-tools/tanstack-devtools';
import { createSecurityHeaders } from '../middleware/csp-helper';
import type { AppRouterContext } from '../router';
import appCss from '../styles/styles.css?url';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { title: 'Buster' },
      {
        name: 'viewport',
        content: 'width=1024, initial-scale=1, user-scalable=no',
      },
      {
        name: 'description',
        content: 'Buster.so is the open source, AI-native data platform.',
      },
      { name: 'og:image', content: shareImage },
      { name: 'og:title', content: 'Buster' },
      {
        name: 'og:description',
        content: 'Buster.so is the open source, AI-native data platform.',
      },
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
  headers: ({ matches }) => {
    const isEmbed = matches.some((match) => match.pathname.startsWith('/embed/'));
    return createSecurityHeaders(isEmbed);
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <RootProviders>{children}</RootProviders>
        <TanstackDevtools />
        <Scripts />
      </body>
    </html>
  );
}
