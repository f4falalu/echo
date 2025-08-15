import { createFileRoute } from '@tanstack/react-router';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppSplitter } from '@/components/ui/layouts/AppSplitter/AppSplitter';
import { useAppSplitterContext } from '../components/ui/layouts/AppSplitter';

const layoutId = 'primary-layout';

export const Route = createFileRoute('/app/home')({
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

  return (
    <div className=" h-full">
      <AppSplitter
        preserveSide="right"
        defaultLayout={['50%', 'auto']}
        autoSaveId={layoutId}
        leftChildren={<div>Left</div>}
        rightChildren={<RightPanel />}
        initialLayout={initialLayout}
        rightPanelMinSize={100}
      />
    </div>
  );
}

const RightPanel = () => {
  const animateWidth = useAppSplitterContext((x) => x.animateWidth);

  return (
    <div className="flex flex-col">
      Right!!!!
      <button
        className="bg-blue-500 text-white p-2 rounded-md"
        type="button"
        onClick={() => animateWidth('100%', 'right', 1000)}
      >
        Animate
      </button>
    </div>
  );
};
