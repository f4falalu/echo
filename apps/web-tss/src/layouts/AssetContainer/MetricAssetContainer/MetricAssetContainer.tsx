import { ClientOnly } from '@tanstack/react-router';
import { AssetContainer } from '../AssetContainer';
import { MetricContainerHeaderSegment } from './MetricContainerHeaderSegment';
import { MetricContainerHeaderButtons } from './MetricHeaderButtons';

export const MetricAssetContainer: React.FC<{
  children: React.ReactNode;
  metricId: string;
  metric_version_number: number | undefined;
}> = ({ children, metricId, metric_version_number }) => {
  return (
    <AssetContainer
      header={
        <MetricAssetHeader metricId={metricId} metric_version_number={metric_version_number} />
      }
    >
      {children}
    </AssetContainer>
  );
};

const MetricAssetHeader: React.FC<{
  metricId: string;
  metric_version_number: number | undefined;
}> = ({ metricId, metric_version_number }) => {
  return (
    <ClientOnly>
      <MetricContainerHeaderSegment
        metricId={metricId}
        metric_version_number={metric_version_number}
      />

      <MetricContainerHeaderButtons
        metricId={metricId}
        metricVersionNumber={metric_version_number}
      />
    </ClientOnly>
  );
};
