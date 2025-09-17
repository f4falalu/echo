import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import { SettingsAppLayout } from '../../layouts/SettingsAppLayout';

const SETTINGS_APP_LAYOUT_ID = 'settings-sidebar';
const DEFAULT_LAYOUT: LayoutSize = ['230px', 'auto'];

export const Route = createFileRoute('/app/_settings')({
  loader: async () => {
    const [initialLayout] = await Promise.all([getAppLayout({ id: SETTINGS_APP_LAYOUT_ID })]);
    return {
      initialLayout,
      defaultLayout: DEFAULT_LAYOUT,
      layoutId: SETTINGS_APP_LAYOUT_ID,
    };
  },
  component: () => {
    const { initialLayout, layoutId, defaultLayout } = Route.useLoaderData();

    return (
      <SettingsAppLayout
        initialLayout={initialLayout}
        layoutId={layoutId}
        defaultLayout={defaultLayout}
      >
        <Outlet />
      </SettingsAppLayout>
    );
  },
});
