import { createFileRoute } from '@tanstack/react-router';
import { AppSplitter } from '@/components/ui/layouts/AppSplitter/AppSplitter';
import { createAutoSaveId } from '../components/ui/layouts/AppLayout';
import { getAppLayout } from '../serverFns/getAppLayout';

export const Route = createFileRoute('/app/home')({
  component: RouteComponent,
  loader: async () => {
    const id = 'test0';
    const initialLayout = await getAppLayout({ data: { id } });
    return {
      initialLayout,
    };
  },
});

function RouteComponent() {
  const { initialLayout } = Route.useLoaderData();
  return (
    <div className=" h-full">
      <AppSplitter
        preserveSide="left"
        defaultLayout={['230px', 'auto']}
        autoSaveId="test0"
        leftChildren={<div>Left</div>}
        rightChildren={<div>Right!!!!</div>}
        initialLayout={initialLayout}
      />
    </div>
  );
}
