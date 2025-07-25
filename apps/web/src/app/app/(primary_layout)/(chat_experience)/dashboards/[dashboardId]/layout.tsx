import { getTitle_server } from '@/api/buster_rest/title';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ dashboardId: string }>;
}) {
  const { dashboardId } = await params;

  return <DashboardLayout dashboardId={dashboardId}>{children}</DashboardLayout>;
}

export async function generateMetadata({ params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;

  try {
    const response = await getTitle_server({
      assetId: dashboardId,
      assetType: 'dashboard'
    });

    return {
      title: response.title || 'New Dashboard'
    };
  } catch (error) {
    console.error('Failed to fetch dashboard title:', error);
    return {
      title: 'New Dashboard'
    };
  }
}
