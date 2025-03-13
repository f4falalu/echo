'use client';

import React, { useEffect, useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { BusterResizeableGrid, BusterResizeableGridRow } from '@/components/ui/grid';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import { hasRemovedMetrics, hasUnmappedMetrics, normalizeNewMetricsIntoGrid } from './helpers';
import { DashboardMetricItem } from './DashboardMetricItem';
import { DashboardContentControllerProvider } from './DashboardContentControllerContext';
import type {
  BusterMetric,
  BusterDashboardResponse,
  DashboardConfig
} from '@/api/asset_interfaces';
import { DashboardEmptyState } from './DashboardEmptyState';
import { type useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: BusterMetric[] = [];
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardContentController: React.FC<{
  allowEdit?: boolean;
  metrics: BusterDashboardResponse['metrics'] | undefined;
  dashboard: BusterDashboardResponse['dashboard'] | undefined;
  onUpdateDashboardConfig: ReturnType<typeof useUpdateDashboardConfig>['mutateAsync'];
  onOpenAddContentModal: () => void;
}> = React.memo(
  ({
    onOpenAddContentModal,
    dashboard,
    allowEdit,
    metrics = DEFAULT_EMPTY_METRICS,
    onUpdateDashboardConfig
  }) => {
    const dashboardConfig = dashboard?.config || DEFAULT_EMPTY_CONFIG;
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
      onUpdateDashboardConfig({ rows: formattedRows, id: dashboard!.id });
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
                    dashboardId={dashboard!.id}
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
      if (remapMetrics && dashboard?.id) {
        debouncedForInitialRenderOnUpdateDashboardConfig({ rows, id: dashboard.id });
      }
    }, [dashboard?.id, remapMetrics]);

    return (
      <div className="dashboard-content-controller">
        {hasMetrics && !!dashboardRows.length && !!dashboard ? (
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
          <DashboardEmptyState onOpenAddContentModal={onOpenAddContentModal} />
        )}
      </div>
    );
  }
);
DashboardContentController.displayName = 'DashboardIndividualDashboard';
