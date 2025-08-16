import { createFileRoute } from '@tanstack/react-router';
import { getAppLayout } from '@/api/server-functions/getAppLayout';

const layoutId = 'primary-layout';

export const Route = createFileRoute('/app/_app/home')({
  head: () => ({
    meta: [
      { title: 'Home' },
      { name: 'description', content: 'Buster home dashboard' },
      { name: 'og:title', content: 'Home' },
      { name: 'og:description', content: 'Buster home dashboard' },
    ],
  }),
  component: RouteComponent,
  loader: async () => {
    const initialLayout = await getAppLayout({ data: { id: layoutId, preservedSide: 'right' } });
    return {
      initialLayout,
    };
  },
});

function RouteComponent() {
  const { initialLayout } = Route.useLoaderData();

  return <div className=" h-full">asdf</div>;
}
