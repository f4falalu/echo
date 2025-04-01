import { BusterRoutes } from '@/routes';
import { FileConfig } from './interfaces';
import { getFileViewFromRoute } from '../helpers';

export const initializeFileViews = ({
  metricId,
  dashboardId,
  currentRoute
}: {
  metricId: string | undefined;
  dashboardId: string | undefined;
  currentRoute: BusterRoutes;
}): Record<string, FileConfig> => {
  if (metricId) {
    return {
      [metricId]: {
        selectedFileView: getFileViewFromRoute(currentRoute) || 'chart',
        fileViewConfig: {}
      }
    };
  }

  if (dashboardId) {
    return {
      [dashboardId]: {
        selectedFileView: getFileViewFromRoute(currentRoute) || 'dashboard',
        fileViewConfig: {}
      }
    };
  }

  return {};
};
