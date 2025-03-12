import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {
  useBusterDashboardContextSelector,
  useBusterDashboardListByFilter
} from '@/context/Dashboards';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useState } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown/Dropdown';
import { AppTooltip } from '@/components/ui/tooltip';
import { Plus } from '@/components/ui/icons';
import type { BusterMetric, BusterDashboardListItem } from '@/api/asset_interfaces';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: BusterMetric['dashboards'];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string) => void;
}> = ({ children, onRemoveFromDashboard, onSaveToDashboard, selectedDashboards }) => {
  const onCreateNewDashboard = useBusterDashboardContextSelector((x) => x.onCreateNewDashboard);
  const isCreatingDashboard = useBusterDashboardContextSelector((x) => x.isCreatingDashboard);
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

  const items: DropdownProps['items'] = useMemo(
    () =>
      (dashboardsList || [])?.map((dashboard) => {
        return {
          value: dashboard.id,
          label: dashboard.name || 'New dashboard',
          selected: selectedDashboards.some((d) => d.id === dashboard.id),
          onClick: () => onClickItem(dashboard),
          link: createBusterRoute({
            route: BusterRoutes.APP_DASHBOARD_ID,
            dashboardId: dashboard.id
          })
        };
      }),
    [dashboardsList]
  );

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

  const memoizedButton = useMemo(() => {
    return (
      <Button
        variant="ghost"
        className="justify-start!"
        loading={isCreatingDashboard}
        block
        prefix={<Plus />}
        onClick={onClickNewDashboardButton}>
        New dashboard
      </Button>
    );
  }, [isCreatingDashboard, onClickNewDashboardButton]);

  return (
    <Dropdown
      side="bottom"
      align="start"
      menuHeader={'Save to a dashboard'}
      open={showDropdown}
      onOpenChange={onOpenChange}
      footerContent={memoizedButton}
      items={items}>
      <AppTooltip title={showDropdown ? '' : 'Save to dashboard'}>{children} </AppTooltip>
    </Dropdown>
  );
};
