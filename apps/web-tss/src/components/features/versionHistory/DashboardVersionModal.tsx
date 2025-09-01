import React from 'react';
import type { VersionHistoryModalProps } from './VersionHistoryModal';

type DashboardVersionModalProps = Pick<VersionHistoryModalProps, 'onClose' | 'versionNumber'> & {
  dashboardId: string;
};

export const DashboardVersionModal = React.memo(
  ({ onClose, versionNumber: versionNumberProp, dashboardId }: DashboardVersionModalProps) => {
    return <div>DashboardVersionModal</div>;
  }
);
