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
  metric_version_number: number | undefined;
}> = ({ children, metricId, metric_version_number }) => {
  return (
    <ClientOnly>
      <MetricAssetContextProvider>
        {({ isMetricEditMode, versionHistoryMode, closeVersionHistoryMode }) => {
          return (
            <React.Fragment>
              <AssetContainer
                headerBorderVariant={isMetricEditMode ? 'default' : 'ghost'}
                header={
                  <MetricAssetHeader
                    metricId={metricId}
                    metric_version_number={metric_version_number}
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
  metric_version_number: number | undefined;
}> = ({ metricId, metric_version_number }) => {
  return (
    <>
      <MetricContainerHeaderSegment
        metricId={metricId}
        metric_version_number={metric_version_number}
      />

      <MetricContainerHeaderButtons
        metricId={metricId}
        metricVersionNumber={metric_version_number}
      />
    </>
  );
};
