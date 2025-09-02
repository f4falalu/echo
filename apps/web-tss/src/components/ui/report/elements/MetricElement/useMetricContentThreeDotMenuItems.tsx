import type { TElement } from 'platejs';
import { type PlateEditor, useEditorRef, useElement } from 'platejs/react';
import React, { useMemo } from 'react';
import {
  useDownloadMetricDataCSV,
  useDownloadPNGSelectMenu,
  useRenameMetricOnPage,
} from '@/components/features/metrics/threeDotMenuHooks';
import {
  createDropdownItem,
  createDropdownItems,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { ArrowUpRight, Code, SquareChartPen, Table, Trash } from '@/components/ui/icons';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

export const useMetricContentThreeDotMenuItems = ({
  metricId,
  reportId,
  chatId,
  reportVersionNumber,
  metricVersionNumber,
}: {
  metricId: string;
  chatId: string | undefined;
  metricVersionNumber: number | undefined;
  reportVersionNumber: number | undefined;
  reportId: string;
}): IDropdownItems => {
  const editor = useEditorRef();
  const element = useElement();

  const openChartItem = useOpenChartItem({
    reportId,
    metricId,
    chatId,
    reportVersionNumber,
    metricVersionNumber,
  });
  const removeFromReportItem = useRemoveFromReportItem({
    editor,
    element,
  });
  const navigateToMetricItem = useNavigatetoMetricItem({
    reportId,
    metricId,
    chatId,
    reportVersionNumber,
    metricVersionNumber,
  });
  const downloadCSV = useDownloadMetricDataCSV({ metricId, metricVersionNumber });
  const downloadPNG = useDownloadPNGSelectMenu({ metricId, metricVersionNumber });
  const renameMetric = useRenameMetricOnPage({ metricId, metricVersionNumber });

  return useMemo(
    () => [
      openChartItem,
      removeFromReportItem,
      { type: 'divider' },
      ...navigateToMetricItem,
      { type: 'divider' },
      downloadCSV,
      downloadPNG,
      { type: 'divider' },
      renameMetric,
    ],
    [
      openChartItem,
      removeFromReportItem,
      navigateToMetricItem,
      downloadCSV,
      downloadPNG,
      renameMetric,
    ]
  );
};

const useOpenChartItem = ({
  metricId,
  metricVersionNumber,
}: {
  reportId: string;
  metricId: string;
  metricVersionNumber: number | undefined;
  chatId: string | undefined;
  reportVersionNumber: number | undefined;
}): IDropdownItem => {
  return useMemo(
    () =>
      createDropdownItem({
        value: 'open-chart',
        label: 'Open chart',
        icon: <ArrowUpRight />,
        link: {
          to: '/app/metrics/$metricId/chart',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
        linkIcon: 'arrow-right',
      }),
    []
  );
};

const useRemoveFromReportItem = ({
  editor,
  element,
}: {
  editor: PlateEditor;
  element: TElement;
}): IDropdownItem => {
  return useMemo(
    () =>
      createDropdownItem({
        value: 'remove-from-report',
        label: 'Remove from report',
        icon: <Trash />,
        onClick: () => {
          const path = editor.api.findPath(element);
          editor.tf.removeNodes({ at: path });
        },
      }),
    []
  );
};

const useNavigatetoMetricItem = ({
  reportId,
  metricId,
  chatId,
  reportVersionNumber,
  metricVersionNumber,
}: {
  reportId: string;
  metricId: string;
  metricVersionNumber: number | undefined;
  chatId: string | undefined;
  reportVersionNumber: number | undefined;
}): IDropdownItem[] => {
  return useMemo(() => {
    return createDropdownItems([
      {
        value: 'edit-chart',
        label: 'Edit chart',
        icon: <SquareChartPen />,
        link: {
          to: '/app/metrics/$metricId/chart',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      },
      {
        value: 'results-chart',
        label: 'Results chart',
        icon: <Table />,
        link: {
          to: '/app/metrics/$metricId/results',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      },
      {
        value: 'sql-chart',
        label: 'SQL chart',
        icon: <Code />,
        link: {
          to: '/app/metrics/$metricId/sql',
          params: {
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      },
    ]);
  }, [reportId, metricId, chatId, reportVersionNumber, metricVersionNumber]);
};
