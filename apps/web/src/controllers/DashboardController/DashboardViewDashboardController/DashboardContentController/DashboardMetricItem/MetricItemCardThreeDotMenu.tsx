'use client';

import React, { useMemo, useState } from 'react';
import { useRemoveMetricsFromDashboard } from '@/api/buster_rest/dashboards';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownItems, type DropdownItem } from '@/components/ui/dropdown';
import {
  DotsVertical,
  Trash,
  WandSparkle,
  ShareRight,
  PenSparkle,
  SquareChartPen,
  Code
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { FollowUpWithAssetContent } from '@/components/features/popups/FollowUpWithAsset';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { getIsEffectiveOwner } from '@/lib/share';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import { useStartChatFromAsset } from '@/api/buster_rest/chats';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {
  useFavoriteMetricSelectMenu,
  useVersionHistorySelectMenu
} from '@/components/features/metrics/ThreeDotMenu';

export const MetricItemCardThreeDotMenu: React.FC<{
  dashboardId: string;
  metricId: string;
}> = ({ dashboardId, metricId }) => {
  return (
    <MetricItemCardThreeDotMenuPopover dashboardId={dashboardId} metricId={metricId}>
      <Button variant="ghost" className="bg-item-hover!" prefix={<DotsVertical />} />
    </MetricItemCardThreeDotMenuPopover>
  );
};

const MetricItemCardThreeDotMenuPopover: React.FC<{
  className?: string;
  dashboardId: string;
  metricId: string;
  children: React.ReactNode;
}> = React.memo(({ children, dashboardId, metricId, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const removeFromDashboardItem = useRemoveFromDashboardItem({ dashboardId, metricId });
  const openChartItem = useOpenChartItem({ dashboardId, metricId, chatId });
  const drilldownItem = useDrilldownItem({ metricId });
  const shareMenu = useShareMenuSelectMenu({ metricId });
  const editWithAI = useEditWithAI({ metricId, dashboardId, chatId });
  const editChartButton = useEditChartButton({ metricId, dashboardId, chatId });
  const viewResultsButton = useViewResultsButton({ metricId, dashboardId, chatId });
  const viewSQLButton = useViewSQLButton({ metricId, dashboardId, chatId });
  const versionHistoryButton = useVersionHistorySelectMenu({ metricId });
  const favoriteMetricButton = useFavoriteMetricSelectMenu({ metricId });

  const dropdownItems: DropdownItems = useMemo(
    () =>
      [
        openChartItem,
        removeFromDashboardItem,
        { type: 'divider' },
        drilldownItem,
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
        favoriteMetricButton
        //TODO add rename ability
      ].filter(Boolean) as DropdownItems,
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
      favoriteMetricButton
    ]
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={cn(
        // Use opacity and pointer-events instead of display:none to maintain positioning context
        'w-8.5 rounded transition-opacity duration-75',
        'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
        className,
        isOpen && 'pointer-events-auto opacity-100'
      )}>
      <div className="absolute right-1.5">
        <Dropdown items={dropdownItems} side="top" align="end" onOpenChange={setIsOpen}>
          {children}
        </Dropdown>
      </div>
    </div>
  );
});
MetricItemCardThreeDotMenuPopover.displayName = 'MetricItemCardThreeDotMenuPopover';

const useRemoveFromDashboardItem = ({
  dashboardId,
  metricId
}: {
  dashboardId: string;
  metricId: string;
}): DropdownItem => {
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
          metricIds: [metricId]
        });
      }
    }),
    [dashboardId, metricId, removeMetricFromDashboard, isPending]
  );
};

const useOpenChartItem = ({
  dashboardId,
  metricId,
  chatId
}: {
  dashboardId: string;
  metricId: string;
  chatId: string | undefined;
}): DropdownItem => {
  const route = assetParamsToRoute({
    assetId: metricId,
    type: 'metric',
    dashboardId,
    chatId
  });
  return {
    value: 'open-chart',
    label: 'Open chart',
    icon: <ASSET_ICONS.metrics />,
    link: route,
    linkIcon: 'arrow-external'
  };
};

const useDrilldownItem = ({ metricId }: { metricId: string }): DropdownItem => {
  return useMemo(
    () => ({
      value: 'drilldown',
      label: 'Drill down & filter',
      items: [
        <FollowUpWithAssetContent
          key="drilldown-and-filter"
          assetType="metric"
          assetId={metricId}
          placeholder="Describe how you want to drill down or filter..."
          buttonText="Submit request"
        />
      ],
      icon: <WandSparkle />
    }),
    [metricId]
  );
};

const useShareMenuSelectMenu = ({ metricId }: { metricId: string }): DropdownItem | undefined => {
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
                    />
                  ]
                : undefined
          }
        : undefined,
    [metricId, shareAssetConfig, isEffectiveOwner]
  );
};

const useEditWithAI = ({
  metricId,
  dashboardId,
  chatId
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
}): DropdownItem => {
  const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  return useMemo(
    () => ({
      label: 'Edit with AI',
      value: 'edit-with-ai',
      icon: <PenSparkle />,
      loading: isPending,
      onClick: async () => {
        const result = await startChatFromAsset({ asset_id: metricId, asset_type: 'metric' });
        const link = assetParamsToRoute({
          assetId: metricId,
          type: 'metric',
          dashboardId,
          chatId: result.id
        });
        onChangePage(link);
      }
    }),
    [metricId, dashboardId, chatId, startChatFromAsset, onChangePage, isPending]
  );
};

const useEditChartButton = ({
  metricId,
  dashboardId,
  chatId
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
}): DropdownItem => {
  return useMemo(
    () => ({
      label: 'Edit chart',
      value: 'edit-chart',
      icon: <SquareChartPen />,
      link: assetParamsToRoute({
        assetId: metricId,
        type: 'metric',
        dashboardId,
        chatId,
        page: 'chart',
        secondaryView: 'chart-edit'
      })
    }),
    [metricId, dashboardId, chatId]
  );
};

const useViewResultsButton = ({
  metricId,
  dashboardId,
  chatId
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
}): DropdownItem => {
  return useMemo(
    () => ({
      label: 'View results',
      value: 'view-results',
      icon: <ASSET_ICONS.table />,
      link: assetParamsToRoute({
        assetId: metricId,
        type: 'metric',
        dashboardId,
        chatId,
        page: 'results'
      })
    }),
    [metricId, dashboardId, chatId]
  );
};

const useViewSQLButton = ({
  metricId,
  dashboardId,
  chatId
}: {
  metricId: string;
  dashboardId: string;
  chatId: string | undefined;
}): DropdownItem => {
  return useMemo(
    () => ({
      label: 'View SQL',
      value: 'view-sql',
      icon: <Code />,
      link: assetParamsToRoute({
        assetId: metricId,
        type: 'metric',
        dashboardId,
        chatId,
        page: 'sql'
      })
    }),
    [metricId, dashboardId, chatId]
  );
};
