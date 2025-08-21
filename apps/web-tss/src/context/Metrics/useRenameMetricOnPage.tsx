import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Pencil } from '@/components/ui/icons';
import { METRIC_CHART_TITLE_INPUT_ID } from '@/controllers/MetricController/MetricViewChart/MetricViewChartHeader';
import { ensureElementExists } from '@/lib/element';
import { timeout } from '@/lib/timeout';

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
          from: '.' as '/app/metrics/$metricId',
          to: './chart',
          params: { metricId },
          search: metricVersionNumber ? { metric_version_number: metricVersionNumber } : undefined,
        });
        await timeout(100);
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
