import { ClientOnly } from '@tanstack/react-router';
import type React from 'react';
import { DashboardVersionModal } from '@/components/features/versionHistory/DashboardVersionModal';
import { AssetContainer } from '../AssetContainer';
import { DashboardAssetHeader } from './DashboardAssetHeader';
import { DashboardAssetContextProvider } from './DashboardContextProvider';

export const DashboardAssetContainer: React.FC<{
  children: React.ReactNode;
  dashboardId: string;
  dashboardVersionNumber: number | 'LATEST';
}> = ({ children, dashboardId, dashboardVersionNumber }) => {
  return (
    <ClientOnly>
      <DashboardAssetContextProvider>
        {({ closeVersionHistoryMode, versionHistoryMode }) => {
          return (
            <>
              <AssetContainer
                headerBorderVariant={'ghost'}
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

/*

*/
