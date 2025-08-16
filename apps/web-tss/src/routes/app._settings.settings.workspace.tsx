import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/workspace')({
  head: () => ({
    meta: [
      { title: 'Workspace Settings' },
      { name: 'description', content: 'Configure your workspace settings and preferences' },
      { name: 'og:title', content: 'Workspace Settings' },
      { name: 'og:description', content: 'Configure your workspace settings and preferences' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/workspace"!</div>;
}
