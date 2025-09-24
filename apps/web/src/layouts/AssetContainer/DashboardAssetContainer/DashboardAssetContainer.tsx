import { ClientOnly } from '@tanstack/react-router';
import type React from 'react';
import { DashboardVersionModal } from '@/components/features/versionHistory/DashboardVersionModal';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';
import { AssetContainer } from '../AssetContainer';
import { DashboardContainerHeaderSegment } from './DashboardContainerHeaderSegment';
import { DashboardAssetContextProvider } from './DashboardContextProvider';
import { DashboardContainerHeaderButtons } from './DashboardHeaderButtons';

export const DashboardAssetContainer: React.FC<{
  children: React.ReactNode;
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}> = ({ children, dashboardId, dashboardVersionNumber }) => {
  return (
    <ClientOnly>
      <DashboardAssetContextProvider>
        {({ closeVersionHistoryMode, versionHistoryMode }) => {
          return (
            <>
              <AssetContainer
                scrollable
                header={
                  <DashboardAssetHeader
                    dashboardId={dashboardId}
                    dashboardVersionNumber={dashboardVersionNumber}
                  />
                }
              >
                {children}
              </AssetContainer>

              <DashboardVersionModal
                onClose={closeVersionHistoryMode}
                versionNumber={versionHistoryMode}
                dashboardId={dashboardId}
              />
            </>
          );
        }}
      </DashboardAssetContextProvider>
    </ClientOnly>
  );
};

export const DashboardAssetHeader: React.FC<{
  dashboardId: string;
  dashboardVersionNumber: number | undefined;
}> = ({ dashboardId, dashboardVersionNumber }) => {
  return (
    <>
      <DashboardContainerHeaderSegment
        dashboardId={dashboardId}
        dashboardVersionNumber={dashboardVersionNumber}
      />

      <DashboardContainerHeaderButtons
        dashboardId={dashboardId}
        dashboardVersionNumber={dashboardVersionNumber}
      />
    </>
  );
};
