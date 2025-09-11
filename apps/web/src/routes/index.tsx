import { createFileRoute, redirect } from '@tanstack/react-router';
import { preventBrowserCacheHeaders } from '@/middleware/shared-headers';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...preventBrowserCacheHeaders],
  }),
  beforeLoad: async () => {
    throw redirect({ to: '/app/home', replace: true });
  },
  component: () => null,
});
