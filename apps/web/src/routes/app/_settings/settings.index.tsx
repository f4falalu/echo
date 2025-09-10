import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/')({
  beforeLoad: async () => {
    throw redirect({
      to: '/app/settings/profile',
      replace: true,
      statusCode: 302,
    });
  },
});
