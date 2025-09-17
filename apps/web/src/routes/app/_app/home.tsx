import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchListShortcuts } from '@/api/buster_rest/shortcuts/queryRequests';
import {
  prefetchGetMyUserInfo,
  prefetchGetSuggestedPrompts,
} from '@/api/buster_rest/users/queryRequests';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { HomePageController, HomePageHeader } from '@/controllers/HomePage';

const searchParamsSchema = z.object({
  q: z.string().optional(),
  submit: z
    .preprocess((val) => {
      if (typeof val === 'string') val === 'true';
      return val;
    }, z.boolean())
    .optional(),
});

export const Route = createFileRoute('/app/_app/home')({
  ssr: false,
  head: () => {
    return {
      meta: [
        { title: 'Home' },
        { name: 'description', content: 'Buster home dashboard' },
        { name: 'og:title', content: 'Home' },
        { name: 'og:description', content: 'Buster home dashboard' },
      ],
    };
  },
  validateSearch: searchParamsSchema,
  loader: async ({ context }) => {
    const { queryClient } = context;
    console.time('home route loader');
    const user = await prefetchGetMyUserInfo(queryClient);
    if (user?.user?.id) {
      await Promise.all([
        prefetchListShortcuts(queryClient),
        prefetchGetSuggestedPrompts(user.user.id, queryClient),
      ]);
    }
    console.timeEnd('home route loader');
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { q, submit } = Route.useSearch();

  return (
    <AppPageLayout headerSizeVariant="list" header={<HomePageHeader />}>
      <HomePageController initialValue={q} autoSubmit={submit} />
    </AppPageLayout>
  );
}
