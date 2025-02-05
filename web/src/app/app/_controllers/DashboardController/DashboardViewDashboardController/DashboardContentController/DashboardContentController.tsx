'use client';

import React, { useEffect, useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { BusterResizeableGrid, BusterResizeableGridRow } from '@/components/grid';
import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { hasRemovedMetrics, hasUnmappedMetrics, normalizeNewMetricsIntoGrid } from './helpers';
import { DashboardMetricItem } from './DashboardMetricItem';
import type { useDashboards } from '@/context/Dashboards';
import { DashboardContentControllerProvider } from './DashboardContentControllerContext';
import type {
  BusterMetric,
  BusterDashboardResponse,
  DashboardConfig
} from '@/api/asset_interfaces';
import { DashboardEmptyState } from './DashboardEmptyState';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: BusterMetric[] = [];
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardContentController: React.FC<{
  allowEdit?: boolean;
  metrics: BusterDashboardResponse['metrics'];
  dashboard: BusterDashboardResponse['dashboard'];
  onUpdateDashboardConfig: ReturnType<typeof useDashboards>['onUpdateDashboardConfig'];
  openAddContentModal: () => void;
}> = React.memo(
  ({
    openAddContentModal,
    dashboard,
    allowEdit,
    metrics = DEFAULT_EMPTY_METRICS,
    onUpdateDashboardConfig
  }) => {
    const dashboardConfig = dashboard.config || DEFAULT_EMPTY_CONFIG;
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
      onUpdateDashboardConfig({ rows: formattedRows }, dashboard.id);
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
                    dashboardId={dashboard.id}
                    allowEdit={allowEdit}
                    numberOfMetrics={metrics.length}
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
      if (remapMetrics && dashboard.id) {
        debouncedForInitialRenderOnUpdateDashboardConfig({
          rows: rows
        });
      }
    }, [dashboard.id, remapMetrics]);

    return (
      <div className="h-full w-full">
        {hasMetrics && !!dashboardRows.length ? (
          <DashboardContentControllerProvider dashboard={dashboard}>
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
                    dashboardId={dashboard.id}
                    isDragOverlay
                    numberOfMetrics={metrics.length}
                  />
                )
              }
            />
          </DashboardContentControllerProvider>
        ) : (
          <DashboardEmptyState openAddContentModal={openAddContentModal} />
        )}
      </div>
    );
  }
);
DashboardContentController.displayName = 'DashboardIndividualDashboard';
