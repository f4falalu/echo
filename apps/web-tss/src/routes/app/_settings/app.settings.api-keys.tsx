import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/app/settings/api-keys')({
  head: () => ({
    meta: [
      { title: 'API Keys' },
      { name: 'description', content: 'Manage your API keys and integrations' },
      { name: 'og:title', content: 'API Keys' },
      { name: 'og:description', content: 'Manage your API keys and integrations' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/api-keys"!</div>;
}
