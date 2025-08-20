import { useMemo } from 'react';
import { Pencil } from '@/components/ui/icons';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { METRIC_CHART_TITLE_INPUT_ID } from '@/controllers/MetricController/MetricViewChart/MetricViewChartHeader';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { assetParamsToRoute } from '@/lib/assets';
import { ensureElementExists } from '@/lib/element';
import { timeout } from '@/lib/timeout';

export const useRenameMetricOnPage = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { chatId, dashboardId, reportId, dashboardVersionNumber, reportVersionNumber } =
    useChatLayoutContextSelector((x) => ({
      chatId: x.chatId,
      dashboardId: x.dashboardId,
      reportId: x.reportId,
      dashboardVersionNumber: x.dashboardVersionNumber,
      reportVersionNumber: x.reportVersionNumber,
    }));

  return useMemo(
    () => ({
      label: 'Rename metric',
      value: 'rename-metric',
      icon: <Pencil />,
      onClick: async () => {
        const route = assetParamsToRoute({
          type: 'metric',
          assetId: metricId,
          chatId,
          dashboardId,
          reportId,
          dashboardVersionNumber,
          reportVersionNumber,
          metricVersionNumber,
          page: 'chart',
        });
        await onChangePage(route);
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
    [
      onSetFileView,
      metricId,
      metricVersionNumber,
      onChangePage,
      chatId,
      dashboardId,
      reportId,
      dashboardVersionNumber,
      reportVersionNumber,
    ]
  );
};
