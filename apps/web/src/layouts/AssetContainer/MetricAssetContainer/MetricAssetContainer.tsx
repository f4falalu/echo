import { ClientOnly } from '@tanstack/react-router';
import React from 'react';
import { MetricVersionHistoryModal } from '@/components/features/versionHistory/MetricVersionHistoryModal';
import { AssetContainer } from '../AssetContainer';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { MetricAssetContextProvider } from './MetricContextProvider';
import { MetricContainerHeaderButtons } from './MetricHeaderButtons';

export const MetricAssetContainer: React.FC<{
  children: React.ReactNode;
  metricId: string;
  metricVersionNumber: number | undefined;
}> = ({ children, metricId, metricVersionNumber }) => {
  return (
    <ClientOnly>
      <MetricAssetContextProvider>
        {({ isMetricEditMode, versionHistoryMode, closeVersionHistoryMode }) => {
          return (
            <React.Fragment>
              <AssetContainer
                headerBorderVariant={isMetricEditMode ? 'default' : undefined}
                header={
                  <MetricAssetHeader
                    metricId={metricId}
                    metricVersionNumber={metricVersionNumber}
                  />
                }
              >
                {children}
              </AssetContainer>

              <MetricVersionHistoryModal
                onClose={closeVersionHistoryMode}
                versionNumber={versionHistoryMode}
                metricId={metricId}
              />
            </React.Fragment>
          );
        }}
      </MetricAssetContextProvider>
    </ClientOnly>
  );
};

const MetricAssetHeader: React.FC<{
  metricId: string;
  metricVersionNumber: number | undefined;
}> = ({ metricId, metricVersionNumber }) => {
  return (
    <>
      <MetricContainerHeaderSegment metricId={metricId} metricVersionNumber={metricVersionNumber} />

      <MetricContainerHeaderButtons metricId={metricId} metricVersionNumber={metricVersionNumber} />
    </>
  );
};
