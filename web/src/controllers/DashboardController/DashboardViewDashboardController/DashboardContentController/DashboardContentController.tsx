'use client';

import React, { useEffect, useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { BusterResizeableGrid, BusterResizeableGridRow } from '@/components/ui/grid';
import { useDebounceFn, useMemoizedFn } from '@/hooks';
import {
  hasRemovedMetrics,
  hasUnmappedMetrics,
  normalizeNewMetricsIntoGrid,
  removeChildrenFromItems
} from './helpers';
import { DashboardMetricItem } from './DashboardMetricItem';
import { DashboardContentControllerProvider } from './DashboardContentControllerContext';
import type {
  BusterMetric,
  BusterDashboardResponse,
  DashboardConfig
} from '@/api/asset_interfaces';
import { DashboardEmptyState } from './DashboardEmptyState';
import { type useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';
import omit from 'lodash/omit';

const DEFAULT_EMPTY_ROWS: DashboardConfig['rows'] = [];
const DEFAULT_EMPTY_METRICS: Record<string, BusterMetric> = {};
const DEFAULT_EMPTY_CONFIG: DashboardConfig = {};

export const DashboardContentController: React.FC<{
  readOnly?: boolean;
  metrics: BusterDashboardResponse['metrics'] | undefined;
  dashboard: BusterDashboardResponse['dashboard'] | undefined;
  onUpdateDashboardConfig: ReturnType<typeof useUpdateDashboardConfig>['mutateAsync'];
  onOpenAddContentModal: () => void;
}> = React.memo(
  ({
    onOpenAddContentModal,
    dashboard,
    readOnly = false,
    metrics = DEFAULT_EMPTY_METRICS,
    onUpdateDashboardConfig
  }) => {
    const dashboardConfig = dashboard?.config || DEFAULT_EMPTY_CONFIG;
    const configRows = dashboardConfig?.rows || DEFAULT_EMPTY_ROWS;
    const hasMetrics = !isEmpty(metrics);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const numberOfMetrics = Object.values(metrics).length;

    const remapMetrics = useMemo(() => {
      return hasUnmappedMetrics(metrics, configRows) || hasRemovedMetrics(metrics, configRows);
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
                    readOnly={readOnly}
                    numberOfMetrics={numberOfMetrics}
                  />
                )
              };
            })
          };
        });
    }, [rows, readOnly, dashboard?.id, numberOfMetrics]);

    const { run: debouncedForInitialRenderOnUpdateDashboardConfig } = useDebounceFn(
      onUpdateDashboardConfig,
      { wait: 650, leading: true }
    );

    const onRowLayoutChange = useMemoizedFn((rows: BusterResizeableGridRow[]) => {
      if (dashboard) {
        onUpdateDashboardConfig({ rows: removeChildrenFromItems(rows), id: dashboard.id });
      }
    });

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
              readOnly={readOnly}
              onRowLayoutChange={onRowLayoutChange}
              onStartDrag={onStartDrag}
              onEndDrag={onDragEnd}
              overlayComponent={
                draggingId && (
                  <DashboardMetricItem
                    metricId={draggingId}
                    readOnly={false}
                    dashboardId={dashboard.id}
                    isDragOverlay
                    numberOfMetrics={numberOfMetrics}
                  />
                )
              }
            />
          </DashboardContentControllerProvider>
        ) : !readOnly ? (
          <DashboardEmptyState onOpenAddContentModal={onOpenAddContentModal} />
        ) : null}
      </div>
    );
  }
);
DashboardContentController.displayName = 'DashboardIndividualDashboard';
