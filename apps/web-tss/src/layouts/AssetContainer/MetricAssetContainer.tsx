import { AssetContainer } from './AssetContainer';

export const MetricAssetContainer: React.FC<{
  children: React.ReactNode;
  metricId: string;
  metric_version_number: number | undefined;
}> = ({ children, metricId, metric_version_number }) => {
  return (
    <AssetContainer>
      METRIC {children} {metricId} {metric_version_number}
    </AssetContainer>
  );
};
