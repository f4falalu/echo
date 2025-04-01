import type { DashboardFileView } from '@/layouts/ChatLayout';
import { DashboardViewDashboardController } from './DashboardViewDashboardController';
import { DashboardViewFileController } from './DashboardViewFileController';
import React from 'react';

export interface DashboardViewProps {
  dashboardId: string;
  chatId: string | undefined;
  readOnly?: boolean;
}

export const DashboardViewComponents: Record<DashboardFileView, React.FC<DashboardViewProps>> = {
  dashboard: DashboardViewDashboardController,
  file: DashboardViewFileController
};
