import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useState } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { Button } from '@/components/ui/buttons';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown/Dropdown';
import { Plus } from '@/components/ui/icons';
import type { BusterDashboardListItem } from '@/api/asset_interfaces';
import { useCreateDashboard, useGetDashboardsList } from '@/api/buster_rest/dashboards';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: string[];
  side?: 'top' | 'bottom';
  align?: 'start' | 'end' | 'center';
  onOpenChange?: (open: boolean) => void;
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string[]) => Promise<void>;
}> = ({
  children,
  onRemoveFromDashboard,
  onSaveToDashboard,
  selectedDashboards,
  side = 'bottom',
  align = 'end',
  onOpenChange: onOpenChangeProp
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
    onOpenChangeProp?.(open);
  });

  const dropdownProps = useSaveToDashboardDropdownContent({
    selectedDashboards,
    onSaveToDashboard,
    onRemoveFromDashboard
  });

  return (
    <Dropdown
      side={side}
      align={align}
      open={showDropdown}
      onOpenChange={onOpenChange}
      {...dropdownProps}>
      {children}
    </Dropdown>
  );
};

export const useSaveToDashboardDropdownContent = ({
  selectedDashboards,
  onSaveToDashboard,
  onRemoveFromDashboard
}: {
  selectedDashboards: string[];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string[]) => Promise<void>;
}): Pick<
  DropdownProps,
  'items' | 'footerContent' | 'menuHeader' | 'selectType' | 'emptyStateText'
> => {
  const { mutateAsync: createDashboard, isPending: isCreatingDashboard } = useCreateDashboard();
  const { data: dashboardsList } = useGetDashboardsList({});
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const onClickItem = useMemoizedFn(async (dashboard: BusterDashboardListItem) => {
    const isSelected = selectedDashboards.some((d) => d === dashboard.id);
    if (isSelected) {
      await onRemoveFromDashboard([dashboard.id]);
    } else {
      await onSaveToDashboard([dashboard.id]);
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
          selected: selectedDashboards.some((d) => d === dashboard.id),
          onClick: () => onClickItem(dashboard),
          link: createBusterRoute({
            route: BusterRoutes.APP_DASHBOARD_ID,
            dashboardId: dashboard.id
          })
        };
      }),
    [dashboardsList, selectedDashboards]
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
