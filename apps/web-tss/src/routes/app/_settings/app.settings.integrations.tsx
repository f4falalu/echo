import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/app/settings/integrations')({
  head: () => ({
    meta: [
      { title: 'Integrations' },
      { name: 'description', content: 'Configure third-party integrations and connections' },
      { name: 'og:title', content: 'Integrations' },
      { name: 'og:description', content: 'Configure third-party integrations and connections' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/integrations"!</div>;
}
