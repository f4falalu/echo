import React, { useMemo } from 'react';
import type { DropdownItem, DropdownItems } from '@/components/ui/dropdown';
import { Code, SquareChartPen, Table, Trash } from '@/components/ui/icons';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import { ArrowUpRight } from '@/components/ui/icons';
import { useEditorRef, useElement, type PlateEditor } from 'platejs/react';
import type { TElement } from 'platejs';
import {
  useDownloadMetricDataCSV,
  useDownloadPNGSelectMenu,
  useRenameMetricOnPage
} from '@/context/Metrics/metricDropdownItems';

export const useMetricContentThreeDotMenuItems = ({
  metricId,
  reportId,
  chatId,
  reportVersionNumber,
  metricVersionNumber
}: {
  metricId: string;
  chatId: string | undefined;
  metricVersionNumber: number | undefined;
  reportVersionNumber: number | undefined;
  reportId: string;
}): DropdownItems => {
  const editor = useEditorRef();
  const element = useElement();

  const openChartItem = useOpenChartItem({
    reportId,
    metricId,
    chatId,
    reportVersionNumber,
    metricVersionNumber
  });
  const removeFromReportItem = useRemoveFromReportItem({
    editor,
    element
  });
  const navigateToMetricItem = useNavigatetoMetricItem({
    reportId,
    metricId,
    chatId,
    reportVersionNumber,
    metricVersionNumber
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
      renameMetric
    ],
    [
      openChartItem,
      removeFromReportItem,
      navigateToMetricItem,
      downloadCSV,
      downloadPNG,
      renameMetric
    ]
  );
};

const useOpenChartItem = ({
  reportId,
  metricId,
  chatId,
  reportVersionNumber,
  metricVersionNumber
}: {
  reportId: string;
  metricId: string;
  metricVersionNumber: number | undefined;
  chatId: string | undefined;
  reportVersionNumber: number | undefined;
}): DropdownItem => {
  const route = assetParamsToRoute({
    assetId: metricId,
    type: 'metric',
    reportVersionNumber,
    metricVersionNumber,
    reportId,
    metricId,
    chatId
  });
  return useMemo(
    () => ({
      value: 'open-chart',
      label: 'Open chart',
      icon: <ArrowUpRight />,
      link: route,
      linkIcon: 'arrow-right'
    }),
    [route]
  );
};

const useRemoveFromReportItem = ({
  editor,
  element
}: {
  editor: PlateEditor;
  element: TElement;
}): DropdownItem => {
  return useMemo(
    () => ({
      value: 'remove-from-report',
      label: 'Remove from report',
      icon: <Trash />,
      onClick: () => {
        const path = editor.api.findPath(element);
        editor.tf.removeNodes({ at: path });
      }
    }),
    []
  );
};

const useNavigatetoMetricItem = ({
  reportId,
  metricId,
  chatId,
  reportVersionNumber,
  metricVersionNumber
}: {
  reportId: string;
  metricId: string;
  metricVersionNumber: number | undefined;
  chatId: string | undefined;
  reportVersionNumber: number | undefined;
}): DropdownItem[] => {
  return useMemo(() => {
    const baseParams = {
      assetId: metricId,
      type: 'metric' as const,
      reportVersionNumber,
      metricVersionNumber,
      reportId,
      chatId
    };

    const editChartRoute = assetParamsToRoute({
      ...baseParams,
      page: 'chart'
    });

    const resultsChartRoute = assetParamsToRoute({
      ...baseParams,
      page: 'results'
    });

    const sqlChartRoute = assetParamsToRoute({
      ...baseParams,
      page: 'sql'
    });

    return [
      { value: 'edit-chart', label: 'Edit chart', icon: <SquareChartPen />, link: editChartRoute },
      { value: 'results-chart', label: 'Results chart', icon: <Table />, link: resultsChartRoute },
      { value: 'sql-chart', label: 'SQL chart', icon: <Code />, link: sqlChartRoute }
    ];
  }, [reportId, metricId, chatId, reportVersionNumber, metricVersionNumber]);
};
