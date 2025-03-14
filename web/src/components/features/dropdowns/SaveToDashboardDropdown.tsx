import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useState } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown/Dropdown';
import { AppTooltip } from '@/components/ui/tooltip';
import { Plus } from '@/components/ui/icons';
import type { BusterMetric, BusterDashboardListItem } from '@/api/asset_interfaces';
import { useCreateDashboard, useGetDashboardsList } from '@/api/buster_rest/dashboards';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: BusterMetric['dashboards'];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string) => void;
}> = ({ children, onRemoveFromDashboard, onSaveToDashboard, selectedDashboards }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
  });

  const dropdownProps = useSaveToDashboardDropdownContent({
    selectedDashboards,
    onSaveToDashboard,
    onRemoveFromDashboard
  });

  return (
    <Dropdown
      side="bottom"
      align="start"
      open={showDropdown}
      onOpenChange={onOpenChange}
      {...dropdownProps}>
      <AppTooltip title={showDropdown ? '' : 'Save to dashboard'}>{children} </AppTooltip>
    </Dropdown>
  );
};

export const useSaveToDashboardDropdownContent = ({
  selectedDashboards,
  onSaveToDashboard,
  onRemoveFromDashboard
}: {
  selectedDashboards: BusterMetric['dashboards'];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string) => void;
}): Pick<
  DropdownProps,
  'items' | 'footerContent' | 'menuHeader' | 'selectType' | 'emptyStateText'
> => {
  const { mutateAsync: createDashboard, isPending: isCreatingDashboard } = useCreateDashboard();
  const { data: dashboardsList } = useGetDashboardsList({});
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const onClickItem = useMemoizedFn(async (dashboard: BusterDashboardListItem) => {
    const isSelected = selectedDashboards.some((d) => d.id === dashboard.id);
    if (isSelected) {
      onRemoveFromDashboard(dashboard.id);
    } else {
      const allDashboardsAndSelected = selectedDashboards.map((d) => d.id).concat(dashboard.id);
      await onSaveToDashboard(allDashboardsAndSelected);
    }
  });

  const onClickNewDashboardButton = useMemoizedFn(async () => {
    const res = await createDashboard({});

    if (res?.dashboard?.id) {
      await onSaveToDashboard([res.dashboard.id]);
      onChangePage({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: res.dashboard.id
      });
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

  const footerContent = useMemo(() => {
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

  const menuHeader = useMemo(() => {
    return items.length > 0 ? 'Save to a dashboard' : undefined;
  }, [items.length]);

  return useMemo(
    () => ({
      items,
      footerContent,
      menuHeader,
      emptyStateText: 'No dashboards found',
      selectType: 'multiple'
    }),
    [items, footerContent, menuHeader]
  );
};
