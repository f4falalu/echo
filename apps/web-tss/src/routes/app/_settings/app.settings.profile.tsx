import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/app/settings/profile')({
  head: () => ({
    meta: [
      { title: 'Profile Settings' },
      { name: 'description', content: 'Manage your profile settings and preferences' },
      { name: 'og:title', content: 'Profile Settings' },
      { name: 'og:description', content: 'Manage your profile settings and preferences' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/profile"!</div>;
}
