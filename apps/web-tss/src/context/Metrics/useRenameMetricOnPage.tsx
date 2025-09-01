import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { METRIC_CHART_TITLE_INPUT_ID } from '@/components/features/metrics/MetricChartCard/MetricViewChartHeader';
import { Pencil } from '@/components/ui/icons';
import { ensureElementExists } from '@/lib/element';

export const useRenameMetricOnPage = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      label: 'Rename metric',
      value: 'rename-metric',
      icon: <Pencil />,
      onClick: async () => {
        await navigate({
          unsafeRelative: 'path',
          to: '../chart' as '/app/metrics/$metricId/chart',
          params: (prev) => ({ ...prev, metricId }),
          search: metricVersionNumber ? { metric_version_number: metricVersionNumber } : undefined,
        });
        const input = await ensureElementExists(
          () => document.getElementById(METRIC_CHART_TITLE_INPUT_ID) as HTMLInputElement
        );
        if (input) {
          input.focus();
          input.select();
        }
      },
    }),
    [navigate, metricId, metricVersionNumber]
  );
};
