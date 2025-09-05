import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetCollectionsList } from '@/api/buster_rest/collections';
import { CollectionListController } from '@/controllers/CollectionListController';

export const Route = createFileRoute('/app/_app/collections/')({
  head: () => ({
    meta: [
      { title: 'Collections' },
      { name: 'description', content: 'Browse and organize your collections' },
      { name: 'og:title', content: 'Collections' },
      { name: 'og:description', content: 'Browse and organize your collections' },
    ],
  }),
  loader: async ({ context }) => {
    prefetchGetCollectionsList(context.queryClient); //do not wait
  },
  component: CollectionListController,
});
