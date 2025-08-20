import { useMemo, useState } from 'react';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { Download4 } from '@/components/ui/icons';
import { exportJSONToCSV } from '@/lib/exportUtils';

export const useDownloadMetricDataCSV = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: metricData } = useGetMetricData(
    { id: metricId, versionNumber: metricVersionNumber },
    { enabled: false }
  );
  const { data: name } = useGetMetric({ id: metricId }, { select: (x) => x.name });

  return useMemo(
    () => ({
      label: 'Download as CSV',
      value: 'download-csv',
      icon: <Download4 />,
      loading: isDownloading,
      onClick: async () => {
        const data = metricData?.data;
        if (data && name) {
          setIsDownloading(true);
          await exportJSONToCSV(data, name);
          setIsDownloading(false);
        }
      },
    }),
    [metricData, isDownloading, name]
  );
};
