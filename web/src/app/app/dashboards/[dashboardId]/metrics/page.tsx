import { BusterRoutes, createBusterRoute } from '@/routes';
import { permanentRedirect } from 'next/navigation';

export default function DashboardPage() {
  return permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_DASHBOARDS
    })
  );
}
