import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { Button } from 'antd';
import { AppDropdownSelect } from '@/components/dropdown';
import { AppTooltip } from '@/components/tooltip';
import { AppMaterialIcons } from '@/components/icons';
import type { BusterMetricAsset } from '@/api/asset_interfaces';
import type { BusterDashboardListItem } from '@/api/asset_interfaces';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: BusterMetricAsset['dashboards'];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string) => void;
}> = ({ children, onRemoveFromDashboard, onSaveToDashboard, selectedDashboards }) => {
  const onCreateNewDashboard = useDashboardContextSelector((x) => x.onCreateNewDashboard);
  const creatingDashboard = useDashboardContextSelector((x) => x.creatingDashboard);
  const initDashboardsList = useDashboardContextSelector((x) => x.initDashboardsList);
  const dashboardsList = useDashboardContextSelector((state) => state.dashboardsList);
  const saveThreadToDashboard = useBusterThreadsContextSelector(
    (state) => state.saveThreadToDashboard
  );
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const [showDropdown, setShowDropdown] = React.useState(false);

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
      // await saveThreadToDashboard({
      //   threadId,
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
      initDashboardsList();
    }
  }, [showDropdown]);

  return (
    <>
      <AppDropdownSelect
        trigger={['click']}
        headerContent={'Save to a dashboard'}
        placement="bottomRight"
        open={showDropdown}
        onOpenChange={onOpenChange}
        footerContent={
          <Button
            type="text"
            className="!justify-start"
            loading={creatingDashboard}
            block
            icon={<AppMaterialIcons icon="add" />}
            onClick={onClickNewDashboardButton}>
            New dashboard
          </Button>
        }
        items={items}
        selectedItems={selectedItems}>
        <AppTooltip title={showDropdown ? '' : 'Save to dashboard'}>{children}</AppTooltip>
      </AppDropdownSelect>
    </>
  );
};
