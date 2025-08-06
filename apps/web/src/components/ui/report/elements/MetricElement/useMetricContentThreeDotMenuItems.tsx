import React, { useMemo } from 'react';
import type { DropdownItem, DropdownItems } from '@/components/ui/dropdown';
import { Trash } from '@/components/ui/icons';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';

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
  const openChartItem = useOpenChartItem({
    reportId,
    metricId,
    chatId,
    reportVersionNumber,
    metricVersionNumber
  });

  return [openChartItem, { type: 'divider' }];
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
      icon: <ASSET_ICONS.metrics />,
      link: route,
      linkIcon: 'arrow-external'
    }),
    [route]
  );
};

const useRemoveFromReportItem = ({
  reportId,
  metricId
}: {
  reportId: string;
  metricId: string;
}): DropdownItem => {
  return useMemo(
    () => ({
      value: 'remove-from-report',
      label: 'Remove from report',
      icon: <Trash />,
      onClick: () => {
        console.log('remove from report');
      }
    }),
    []
  );
};
