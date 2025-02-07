import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {
  useBusterDashboardContextSelector,
  useBusterDashboardListByFilter,
  useBusterDashboardListContextSelector
} from '@/context/Dashboards';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useState } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { Button } from 'antd';
import { AppDropdownSelect, AppDropdownSelectProps } from '@/components/dropdown';
import { AppTooltip } from '@/components/tooltip';
import { AppMaterialIcons } from '@/components/icons';
import type { BusterMetric, BusterDashboardListItem } from '@/api/asset_interfaces';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: BusterMetric['dashboards'];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string) => void;
}> = ({ children, onRemoveFromDashboard, onSaveToDashboard, selectedDashboards }) => {
  const onCreateNewDashboard = useBusterDashboardContextSelector((x) => x.onCreateNewDashboard);
  const creatingDashboard = useBusterDashboardContextSelector((x) => x.creatingDashboard);
  const getDashboardsList = useBusterDashboardListContextSelector((x) => x.getDashboardsList);
  const saveMetricToDashboard = useBusterMetricsIndividualContextSelector(
    (state) => state.saveMetricToDashboard
  );
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { list: dashboardsList } = useBusterDashboardListByFilter({});

  const [showDropdown, setShowDropdown] = useState(false);

  const onClickItem = useMemoizedFn(async (dashboard: BusterDashboardListItem) => {
    const isSelected = selectedDashboards.some((d) => d.id === dashboard.id);
    if (isSelected) {
      onRemoveFromDashboard(dashboard.id);
    } else {
      const allDashboardsAndSelected = selectedDashboards.map((d) => d.id).concat(dashboard.id);
      await onSaveToDashboard(allDashboardsAndSelected);
    }
  });

  const items = useMemo(
    () =>
      dashboardsList.map((dashboard) => {
        return {
          key: dashboard.id,
          label: dashboard.name || 'New dashboard',
          onClick: () => onClickItem(dashboard),
          link: createBusterRoute({
            route: BusterRoutes.APP_DASHBOARD_ID,
            dashboardId: dashboard.id
          })
        };
      }),
    [dashboardsList]
  );

  const selectedItems = useMemo(() => {
    return selectedDashboards.map((d) => d.id);
  }, [selectedDashboards]);

  const onClickNewDashboardButton = useMemoizedFn(async () => {
    const res = await onCreateNewDashboard({
      rerouteToDashboard: false
    });

    if (res?.id) {
      await onSaveToDashboard([res.id]);
      // await saveMetricToDashboard({
      //   metricId,
      //   dashboardIds: [res.id]
      // });
    }

    if (res?.id) {
      onChangePage({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: res.id
      });
    }

    setShowDropdown(false);
  });

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
  });

  useEffect(() => {
    if (showDropdown) {
      getDashboardsList();
    }
  }, [showDropdown]);

  const memoizedTrigger = useMemo<AppDropdownSelectProps['trigger']>(() => ['click'], []);

  const memoizedButton = useMemo(() => {
    return (
      <Button
        type="text"
        className="!justify-start"
        loading={creatingDashboard}
        block
        icon={<AppMaterialIcons icon="add" />}
        onClick={onClickNewDashboardButton}>
        New dashboard
      </Button>
    );
  }, [creatingDashboard, onClickNewDashboardButton]);

  return (
    <>
      <AppDropdownSelect
        trigger={memoizedTrigger}
        headerContent={'Save to a dashboard'}
        placement="bottomRight"
        open={showDropdown}
        onOpenChange={onOpenChange}
        footerContent={memoizedButton}
        items={items}
        selectedItems={selectedItems}>
        <AppTooltip title={showDropdown ? '' : 'Save to dashboard'}>{children}</AppTooltip>
      </AppDropdownSelect>
    </>
  );
};
