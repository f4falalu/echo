import { Link, useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { useStartChatFromAsset } from '@/api/buster_rest/chats';
import { useRemoveMetricsFromDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import {
  useFavoriteMetricSelectMenu,
  useMetricDrilldownItem,
  useMetricVersionHistorySelectMenu,
} from '@/components/features/metrics/threeDotMenuHooks';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import {
  createDropdownItem,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Code, PenSparkle, ShareRight, SquareChartPen, Trash } from '@/components/ui/icons';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { useMetricEditToggle } from '@/layouts/AssetContainer/MetricAssetContainer';
import { getIsEffectiveOwner } from '@/lib/share';

export const useDashboardMetricCardThreeDotMenuItems = ({
  dashboardId,
  metricId,
  metricVersionNumber,
}: {
  dashboardId: string;
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const chatId = useGetChatId();
  const removeFromDashboardItem = useRemoveFromDashboardItem({ dashboardId, metricId });
  const openChartItem = useOpenChartItem({ metricId, metricVersionNumber });
  const drilldownItem = useMetricDrilldownItem({ metricId });
  const shareMenu = useShareMenuSelectMenu({ metricId });
  const editWithAI = useEditWithAI({ metricId });
  const editChartButton = useEditChartButton({
    metricVersionNumber,
    metricId,
    dashboardId,
    chatId,
  });
  const viewResultsButton = useViewResultsButton({
    metricId,
    dashboardId,
    chatId,
    metricVersionNumber,
  });
  const viewSQLButton = useViewSQLButton({ metricId, dashboardId, chatId, metricVersionNumber });
  const versionHistoryButton = useMetricVersionHistorySelectMenu({ metricId });
  const favoriteMetricButton = useFavoriteMetricSelectMenu({ metricId });

  const dropdownItems: IDropdownItems = useMemo(
    () =>
      [
        openChartItem,
        removeFromDashboardItem,
        { type: 'divider' },
        // drilldownItem,
        shareMenu,
        { type: 'divider' },
        editWithAI,
        editChartButton,
        viewResultsButton,
        viewSQLButton,
        versionHistoryButton,
        //TODO add DOWNLOAD CSV
        //TODO add DOWNLOAD PNG
        { type: 'divider' },
        favoriteMetricButton,
        //TODO add rename ability
      ].filter(Boolean) as IDropdownItems,
    [
      removeFromDashboardItem,
      openChartItem,
      drilldownItem,
      shareMenu,
      editWithAI,
      editChartButton,
      viewResultsButton,
      viewSQLButton,
      versionHistoryButton,
      favoriteMetricButton,
    ]
  );

  return dropdownItems;
};

const useRemoveFromDashboardItem = ({
  dashboardId,
  metricId,
}: {
  dashboardId: string;
  metricId: string;
}): IDropdownItem => {
  const { mutateAsync: removeMetricFromDashboard, isPending } = useRemoveMetricsFromDashboard();

  return useMemo(
    () => ({
      value: 'delete',
      label: 'Remove from dashboard',
      icon: <Trash />,
      loading: isPending,
      onClick: async () => {
        await removeMetricFromDashboard({
          dashboardId,
          metricIds: [metricId],
        });
      },
    }),
    [dashboardId, metricId, removeMetricFromDashboard, isPending]
  );
};

const useOpenChartItem = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}): IDropdownItem => {
  return createDropdownItem({
    value: 'open-chart',
    label: 'Open chart',
    icon: <ASSET_ICONS.metrics />,
    link: {
      to: '/app/metrics/$metricId/chart',
      params: {
        metricId,
      },
      search: {
        metric_version_number: metricVersionNumber,
      },
    },

    linkIcon: 'arrow-external',
  });
};

const useShareMenuSelectMenu = ({ metricId }: { metricId: string }): IDropdownItem | undefined => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId },
    { select: getShareAssetConfig }
  );
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () =>
      isEffectiveOwner && shareAssetConfig
        ? {
            label: 'Share metric',
            value: 'share-metric',
            icon: <ShareRight />,
            disabled: !isEffectiveOwner,
            items:
              isEffectiveOwner && shareAssetConfig
                ? [
                    <ShareMenuContent
                      key={metricId}
                      shareAssetConfig={shareAssetConfig}
                      assetId={metricId}
                      assetType={'metric'}
                    />,
                  ]
                : undefined,
          }
        : undefined,
    [metricId, shareAssetConfig, isEffectiveOwner]
  );
};

const useEditWithAI = ({ metricId }: { metricId: string }): IDropdownItem => {
  const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
  const navigate = useNavigate();

  return useMemo(
    () => ({
      label: 'Edit with AI',
      value: 'edit-with-ai',
      icon: <PenSparkle />,
      loading: isPending,
      onClick: async () => {
        const result = await startChatFromAsset({ asset_id: metricId, asset_type: 'metric' });
        navigate({
          to: '/app/chats/$chatId/metrics/$metricId',
          params: {
            metricId,
            chatId: result.id,
          },
        });
      },
    }),
    [metricId, startChatFromAsset, isPending]
  );
};

const useEditChartButton = ({
  metricId,
  dashboardId,
  chatId,
  metricVersionNumber,
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
  metricVersionNumber: number | undefined;
}): IDropdownItem => {
  const toggleChartEdit = useMetricEditToggle();
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Edit chart',
        value: 'edit-chart',
        icon: <SquareChartPen />,
        onClick: () => {
          toggleChartEdit(true, { metricId, metricVersionNumber });
        },
      }),
    [metricId, dashboardId, chatId, metricVersionNumber]
  );
};

const useViewResultsButton = ({
  metricId,
  dashboardId,
  metricVersionNumber,
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
  metricVersionNumber: number | undefined;
}): IDropdownItem => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'View results',
        value: 'view-results',
        icon: <ASSET_ICONS.table />,
        link: {
          to: '/app/dashboards/$dashboardId/metrics/$metricId/result',
          params: {
            dashboardId,
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      }),
    [metricId, dashboardId, metricVersionNumber]
  );
};

const useViewSQLButton = ({
  metricId,
  dashboardId,
  chatId,
  metricVersionNumber,
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
  metricVersionNumber: number | undefined;
}): IDropdownItem => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'View SQL',
        value: 'view-sql',
        icon: <Code />,
        link: {
          to: '/app/dashboards/$dashboardId/metrics/$metricId/sql',
          params: {
            dashboardId,
            metricId,
          },
          search: {
            metric_version_number: metricVersionNumber,
          },
        },
      }),
    [metricId, dashboardId, chatId]
  );
};
