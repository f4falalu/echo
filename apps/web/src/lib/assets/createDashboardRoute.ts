import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type { DashboardFileViewSecondary } from '../../layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';

export type DashboardRouteParams = {
  assetId: string;
  chatId?: string;
  secondaryView?: DashboardFileViewSecondary;
  versionNumber?: number;
  type: 'dashboard';
  page?: 'file' | 'dashboard' | undefined;
};

export const createDashboardRoute = ({
  assetId: dashboardId,
  chatId,
  secondaryView,
  versionNumber: dashboardVersionNumber,
  page = 'dashboard'
}: Omit<DashboardRouteParams, 'type'>) => {
  const baseParams = { dashboardVersionNumber, dashboardId, secondaryView };

  if (page === 'dashboard') {
    if (chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
        chatId,
        ...baseParams
      });
    }

    // Non-chat dashboard routes
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      ...baseParams
    });
  }

  if (page === 'file') {
    if (chatId) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
        chatId,
        ...baseParams
      });
    }

    // Non-chat dashboard routes
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      ...baseParams
    });
  }

  const _exhaustiveCheck: never = page;

  return '';
};
