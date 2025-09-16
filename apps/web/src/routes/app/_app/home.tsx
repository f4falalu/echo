import { createFileRoute, getRouteApi } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchListShortcuts } from '@/api/buster_rest/shortcuts/queryRequests';
import {
  prefetchGetMyUserInfo,
  prefetchGetSuggestedPrompts,
} from '@/api/buster_rest/users/queryRequests';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { HomePageController, HomePageHeader } from '@/controllers/HomePage';
import { getSupabaseUser } from '@/integrations/supabase/getSupabaseUserClient';

const searchParamsSchema = z.object({
  q: z.string().optional(),
  submit: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val === 'true';
      }
      return val;
    }, z.boolean())
    .optional(),
});

const RouteRequest = getRouteApi('/app');

export const Route = createFileRoute('/app/_app/home')({
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
    const user = await prefetchGetMyUserInfo(queryClient);
    if (user?.user?.id) {
      prefetchListShortcuts(queryClient);
      prefetchGetSuggestedPrompts(user.user.id, queryClient);
    }
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
