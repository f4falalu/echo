import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/logs/')({
  head: () => ({
    meta: [
      { title: 'Logs' },
      { name: 'description', content: 'View system and application logs' },
      { name: 'og:title', content: 'Logs' },
      { name: 'og:description', content: 'View system and application logs' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/logs"!</div>;
}
