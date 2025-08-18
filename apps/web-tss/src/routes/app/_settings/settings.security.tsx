import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/security')({
  head: () => ({
    meta: [
      { title: 'Security Settings' },
      { name: 'description', content: 'Configure security settings and access controls' },
      { name: 'og:title', content: 'Security Settings' },
      { name: 'og:description', content: 'Configure security settings and access controls' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/security"!</div>;
}
