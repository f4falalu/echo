import { useGetMetric } from '@/api/buster_rest/metrics';
import { SquareChart } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { METRIC_CHART_CONTAINER_ID } from '@/controllers/MetricController/MetricViewChart/config';
import { downloadElementToImage } from '@/lib/exportUtils';
import { useMemo } from 'react';

export const useDownloadPNGSelectMenu = ({
  metricId,
  metricVersionNumber
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const { openErrorMessage } = useBusterNotifications();
  const { data: name } = useGetMetric(
    { id: metricId, versionNumber: metricVersionNumber },
    { select: (x) => x.name }
  );
  const { data: selectedChartType } = useGetMetric(
    { id: metricId },
    { select: (x) => x.chart_config?.selectedChartType }
  );

  const canDownload = selectedChartType && selectedChartType !== 'table';

  return useMemo(
    () => ({
      label: 'Download as PNG',
      value: 'download-png',
      disabled: !canDownload,
      icon: <SquareChart />,
      onClick: async () => {
        const node = document.getElementById(METRIC_CHART_CONTAINER_ID(metricId)) as HTMLElement;
        if (node) {
          try {
            return await downloadElementToImage(node, `${name}.png`);
          } catch (error) {
            console.error(error);
          }
        }

        openErrorMessage('Failed to download PNG');
      }
    }),
    [canDownload, metricId, name, openErrorMessage]
  );
};
