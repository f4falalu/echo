import { type ChartType, DEFAULT_CHART_CONFIG } from '@buster/server-shared/metrics';
import { Link, type LinkProps, type RegisteredRouter } from '@tanstack/react-router';
import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import React, { useMemo } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';
import type { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { useGetDashboard, usePrefetchGetDashboardClient } from '@/api/buster_rest/dashboards';
import { useGetMetricMemoized } from '@/api/buster_rest/metrics/metricQueryHelpers';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { Button } from '@/components/ui/buttons';
import { CollapisbleFileCard } from '@/components/ui/card/CollapisbleFileCard';
import { CircleXmark } from '@/components/ui/icons';
import { CircleSpinnerLoader } from '@/components/ui/loaders/CircleSpinnerLoader';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { TextAndVersionText } from '@/components/ui/typography/TextAndVersionText';
import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { useGetMetricParams } from '@/context/Metrics/useGetMetricParams';
import { getSelectedChartTypeConfig } from '@/lib/metrics/selectedChartType';
import type { ILinkProps } from '@/types/routes';
import { defineLink } from '../../../../../lib/routes';

const itemAnimationConfig: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.7 },
};

export const ChatResponseMessage_DashboardFile: React.FC<{
  isStreamFinished: boolean;
  responseMessage: BusterChatResponseMessage_file;
  isSelectedFile: boolean;
  chatId: string;
  linkParams: ILinkProps;
}> = React.memo(({ isStreamFinished, responseMessage, isSelectedFile, chatId, linkParams }) => {
  const { version_number, id, file_name } = responseMessage;
  const { metricId } = useGetMetricParams();
  const { dashboardId } = useGetDashboardParams();
  const prefetchGetDashboard = usePrefetchGetDashboardClient();
  const {
    data: dashboardResponse,
    isError,
    isFetched: isFetchedDashboard,
    isLoading,
  } = useGetDashboard(
    { id, versionNumber: version_number },
    { select: ({ dashboard, metrics }) => ({ dashboard, metrics }) }
  );

  const hasMetrics = Object.keys(dashboardResponse?.metrics || {}).length > 0;

  const HeaderWrapper = useMemo(() => {
    if (metricId) {
      return React.Fragment;
    }

    // biome-ignore lint/correctness/noNestedComponentDefinitions: just easier
    const Component = ({ children }: { children: React.ReactNode }) => (
      <Link {...linkParams} preload="viewport">
        {children}
      </Link>
    );
    Component.displayName = 'HeaderWrapper';
    return Component;
  }, [linkParams, metricId]);

  const FileInfo = useMemo(() => {
    if (metricId) {
      return (
        <SelectDashboardButtonAndText
          fileName={file_name}
          dashboardId={id}
          chatId={chatId}
          versionNumber={version_number}
        />
      );
    }

    return <TextAndVersionText text={file_name} version={version_number} />;
  }, [file_name, version_number, metricId]);

  return (
    <AnimatePresence initial={!isStreamFinished}>
      <motion.div
        id={id}
        {...itemAnimationConfig}
        onMouseEnter={() => {
          prefetchGetDashboard(id, version_number);
        }}
      >
        <CollapisbleFileCard
          collapseContent={true}
          collapsible={hasMetrics ? 'chevron' : false}
          selected={isSelectedFile}
          collapseDefaultIcon={<HeaderIcon isLoading={isLoading} isError={isError} />}
          fileName={FileInfo}
          headerWrapper={HeaderWrapper}
        >
          {!hasMetrics ? null : dashboardResponse ? (
            <Content
              dashboardResponse={dashboardResponse}
              isFetched={isFetchedDashboard}
              metricId={metricId}
              dashboardId={dashboardId}
              chatId={chatId}
            />
          ) : (
            <ShimmerText text="Loading..." />
          )}
        </CollapisbleFileCard>
      </motion.div>
    </AnimatePresence>
  );
});

ChatResponseMessage_DashboardFile.displayName = 'ChatResponseMessage_DashboardFile';

const HeaderIcon: React.FC<{
  isLoading: boolean;
  isError: boolean;
}> = React.memo(({ isLoading, isError }) => {
  if (isLoading) {
    return <CircleSpinnerLoader size={12} />;
  }

  if (isError) {
    return (
      <AppTooltip title="Error fetching dashboard">
        <CircleXmark />
      </AppTooltip>
    );
  }

  return <ASSET_ICONS.dashboards />;
});

HeaderIcon.displayName = 'HeaderIcon';

const Content = <
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
>({
  dashboardResponse,
  chatId,
  metricId,
  isFetched,
  dashboardId,
}: {
  dashboardResponse: Pick<BusterDashboardResponse, 'dashboard' | 'metrics'>;
  isFetched: boolean;
  metricId: string | undefined;
  dashboardId: string | undefined;
  chatId: string;
}) => {
  const getMetricMemoized = useGetMetricMemoized();

  type RowItem<
    TRouter extends RegisteredRouter = RegisteredRouter,
    TOptions = Record<string, unknown>,
    TFrom extends string = string,
  > = {
    id: string;
    name: string;
    chartType: ChartType;
    linkParams: ILinkProps<TRouter, TOptions, TFrom>;
    isSelectedMetric: boolean;
    icon: React.ReactNode;
    iconTooltip: string;
  };

  const items: RowItem<TRouter, TOptions, TFrom>[] = useMemo(() => {
    const rows = dashboardResponse.dashboard.config.rows || [];
    return rows.reduce<RowItem<TRouter, TOptions, TFrom>[]>((acc, row) => {
      return acc.concat(
        row.items.map((item) => {
          const metricFromDashboardResponse = dashboardResponse.metrics[item.id];
          const metric =
            getMetricMemoized(item.id, metricFromDashboardResponse?.version_number) ||
            metricFromDashboardResponse;
          const chartType =
            metric.chart_config?.selectedChartType || DEFAULT_CHART_CONFIG.selectedChartType;
          const selectedChartIconConfig = getSelectedChartTypeConfig({
            selectedChartType: chartType,
            lineGroupType: metric.chart_config?.lineGroupType,
            barGroupType: metric.chart_config?.barGroupType,
            barLayout: metric.chart_config?.barLayout,
            hasAreaStyle: false,
          });

          return {
            id: item.id,
            name: metric.file_name || 'Untitled',
            chartType,
            linkParams: {
              to: '/app/chats/$chatId/dashboards/$dashboardId/metrics/$metricId/chart',
              params: {
                chatId,
                metricId: metric.id,
                dashboardId: dashboardResponse.dashboard.id,
              },
            } as ILinkProps<TRouter, TOptions, TFrom>,
            isSelectedMetric:
              metric.id === metricId && dashboardResponse.dashboard.id === dashboardId,
            icon: selectedChartIconConfig?.icon ? <selectedChartIconConfig.icon /> : null,
            iconTooltip: selectedChartIconConfig?.tooltipText || '',
          } satisfies RowItem<TRouter, TOptions, TFrom>;
        })
      );
    }, []);
  }, [
    dashboardResponse.dashboard,
    dashboardResponse.metrics,
    isFetched,
    metricId,
    chatId,
    getMetricMemoized,
  ]);

  return (
    <div
      className="flex flex-col gap-y-2.5 px-3.5 py-2"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {items.map((item) => (
        <div
          className="flex items-center justify-between space-x-2.5 overflow-hidden"
          key={item.id}
        >
          <Link {...item.linkParams} className="truncate">
            <Text
              truncate
              size={'sm'}
              className="cursor-pointer hover:underline"
              variant={item.isSelectedMetric ? 'default' : 'secondary'}
            >
              {item.name}
            </Text>
          </Link>

          <AppTooltip title={item.iconTooltip} delayDuration={300}>
            <div className="flex items-center justify-center text-sm">{item.icon}</div>
          </AppTooltip>
        </div>
      ))}
    </div>
  );
};

Content.displayName = 'Content';

const SelectDashboardButtonAndText: React.FC<{
  chatId: string;
  dashboardId: string;
  fileName: string;
  versionNumber: number;
}> = React.memo(({ fileName, dashboardId, chatId, versionNumber }) => {
  return (
    <div className="flex w-full items-center justify-between space-x-1.5 overflow-hidden">
      <Text size={'base'} truncate>
        {fileName}
      </Text>
      <Link
        to="/app/chats/$chatId/dashboards/$dashboardId"
        params={{
          chatId,
          dashboardId,
        }}
        search={{
          dashboard_version_number: versionNumber,
        }}
      >
        <Button size={'small'} variant={'default'} className="min-w-fit">
          View dashboard
        </Button>
      </Link>
    </div>
  );
});

SelectDashboardButtonAndText.displayName = 'SelectDashboardButtonAndText';
