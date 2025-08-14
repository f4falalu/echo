import { Store, useStore } from '@tanstack/react-store';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';

// type OriginalDashboardStore = {
//   originalDashboards: Record<string, BusterDashboard>;
//   bulkAddOriginalDashboards: (dashboards: Record<string, BusterDashboard>) => void;
//   setOriginalDashboard: (dashboard: BusterDashboard) => void;
//   getOriginalDashboard: (dashboardId: string | undefined) => BusterDashboard | undefined;
//   removeOriginalDashboard: (dashboardId: string) => void;
// };

const originalDashboardStore = new Store(new Map<string, BusterDashboard>());

export const bulkAddOriginalDashboards = (dashboards: Record<string, BusterDashboard>) => {
  Object.entries(dashboards).forEach(([id, dashboard]) => {
    originalDashboardStore.setState((prev) => new Map(prev).set(id, dashboard));
  });
};

export const setOriginalDashboard = (dashboard: BusterDashboard) => {
  originalDashboardStore.setState((prev) => new Map(prev).set(dashboard.id, dashboard));
};

export const getOriginalDashboard = (dashboardId: string) => {
  return originalDashboardStore.state.get(dashboardId);
};

export const removeOriginalDashboard = (dashboardId: string) => {
  originalDashboardStore.setState((prev) => {
    const newState = new Map(prev);
    newState.delete(dashboardId);
    return newState;
  });
};

export const useOriginalDashboardStore = () => {
  return useStore(originalDashboardStore);
};
