import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/dataset-groups')({
  head: () => ({
    meta: [
      { title: 'Dataset Groups' },
      { name: 'description', content: 'Organize datasets into groups and categories' },
      { name: 'og:title', content: 'Dataset Groups' },
      { name: 'og:description', content: 'Organize datasets into groups and categories' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/dataset-groups"!</div>;
}
