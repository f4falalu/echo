import type { DashboardFileView } from '@/layouts/ChatLayout';
import { DashboardViewDashboardController } from './DashboardViewDashboardController';
import { DashboardViewFileController } from './DashboardViewFileController';
import React from 'react';

export interface DashboardViewProps {
  dashboardId: string;
  readOnly?: boolean;
}

export const DashboardViewComponents: Record<DashboardFileView, React.FC<DashboardViewProps>> = {
  dashboard: DashboardViewDashboardController,
  file: DashboardViewFileController
};
