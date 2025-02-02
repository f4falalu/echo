'use client';

import React, { useEffect, useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { Button } from 'antd';
import { BusterResizeableGrid, BusterResizeableGridRow } from '@/components/grid';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { hasRemovedMetrics, hasUnmappedMetrics, normalizeNewMetricsIntoGrid } from './helpers';
import { DashboardMetricItem } from './DashboardMetricItem';
import { useDashboards } from '@/context/Dashboards';
import { AppMaterialIcons } from '@/components/icons';
import { DashboardIndividualProvider } from './DashboardInvididualContext';
import type {
  BusterMetric,
  BusterDashboardResponse,
  DashboardConfig
} from '@/api/asset_interfaces';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: BusterMetric[] = [];
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardIndividualDashboard: React.FC<{
  allowEdit?: boolean;
  dashboardResponse: BusterDashboardResponse;
  onUpdateDashboardConfig: ReturnType<typeof useDashboards>['onUpdateDashboardConfig'];
  openAddContentModal: () => void;
}> = React.memo(
  ({ openAddContentModal, allowEdit, dashboardResponse, onUpdateDashboardConfig }) => {
    const metrics = dashboardResponse.metrics || DEFAULT_EMPTY_METRICS;
    const dashboardConfig = dashboardResponse.dashboard.config || DEFAULT_EMPTY_CONFIG;
    const configRows = dashboardConfig?.rows || DEFAULT_EMPTY_ROWS;
    const hasMetrics = !isEmpty(metrics);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const { run: debouncedForInitialRenderOnUpdateDashboardConfig } = useDebounceFn(
      onUpdateDashboardConfig,
      { wait: 650, leading: true }
    );

    const onRowLayoutChange = useMemoizedFn((rows: BusterResizeableGridRow[]) => {
      const formattedRows: DashboardConfig['rows'] = rows.map((row) => {
        return {
          ...row,
          items: row.items.map((item) => ({
            id: item.id
          }))
        };
      });
      onUpdateDashboardConfig({ rows: formattedRows }, dashboardResponse.dashboard.id);
    });

    const remapMetrics = useMemo(() => {
      const res = hasUnmappedMetrics(metrics, configRows) || hasRemovedMetrics(metrics, configRows);
      return res;
    }, [metrics, configRows.length]);

    const rows = useMemo(() => {
      return remapMetrics ? normalizeNewMetricsIntoGrid(metrics, configRows) : configRows;
    }, [remapMetrics, metrics, configRows]);

    const dashboardRows = useMemo(() => {
      return rows
        .filter((row) => row.items.length > 0)
        .map((row) => {
          return {
            ...row,
            items: row.items.map((item) => {
              return {
                ...item,
                children: (
                  <DashboardMetricItem
                    key={item.id}
                    metricId={item.id}
                    dashboardId={dashboardResponse.dashboard.id}
                    allowEdit={allowEdit}
                    numberOfMetrics={dashboardResponse.metrics.length}
                  />
                )
              };
            })
          };
        });
    }, [rows]);

    const onDragEnd = useMemoizedFn(() => {
      setDraggingId(null);
    });

    const onStartDrag = useMemoizedFn(({ id }: { id: string }) => {
      setDraggingId(id);
    });

    useEffect(() => {
      if (remapMetrics && dashboardResponse.dashboard.id) {
        debouncedForInitialRenderOnUpdateDashboardConfig({
          rows: rows
        });
      }
    }, [dashboardResponse.dashboard.id, remapMetrics]);

    return (
      <div className="h-full w-full">
        {hasMetrics && !!dashboardRows.length ? (
          <DashboardIndividualProvider>
            <BusterResizeableGrid
              rows={dashboardRows}
              allowEdit={allowEdit}
              onRowLayoutChange={onRowLayoutChange}
              onStartDrag={onStartDrag}
              onEndDrag={onDragEnd}
              overlayComponent={
                draggingId && (
                  <DashboardMetricItem
                    metricId={draggingId}
                    allowEdit={false}
                    dashboardId={dashboardResponse.dashboard.id}
                    isDragOverlay
                    numberOfMetrics={dashboardResponse.metrics.length}
                  />
                )
              }
            />
          </DashboardIndividualProvider>
        ) : (
          <DashboardEmptyState openAddContentModal={openAddContentModal} />
        )}
      </div>
    );
  }
);
DashboardIndividualDashboard.displayName = 'DashboardIndividualDashboard';

const DashboardEmptyState: React.FC<{
  openAddContentModal: () => void;
}> = React.memo(({ openAddContentModal }) => {
  return (
    <div className="-ml-1.5">
      <Button type="text" icon={<AppMaterialIcons icon="add" />} onClick={openAddContentModal}>
        Add content
      </Button>
    </div>
  );
});
DashboardEmptyState.displayName = 'DashboardEmptyState';
