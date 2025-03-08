import { VerificationStatus } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { getTooltipText } from './helpers';
import { useMemoizedFn } from '@/hooks';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';

const statuses = [
  VerificationStatus.NOT_REQUESTED,
  VerificationStatus.REQUESTED,
  VerificationStatus.IN_REVIEW,
  VerificationStatus.VERIFIED,
  VerificationStatus.BACKLOGGED
];

const requiresAdminItems = [
  VerificationStatus.IN_REVIEW,
  VerificationStatus.VERIFIED,
  VerificationStatus.BACKLOGGED
];

export const StatusDropdownContent: React.FC<{
  isAdmin: boolean;
  status: VerificationStatus;
  children: React.ReactNode;
  onChangeStatus: (status: VerificationStatus) => void;
  onOpenChange: (open: boolean) => void;
}> = React.memo(({ isAdmin, status, onChangeStatus, children, onOpenChange }) => {
  const items = useMemo(() => {
    return statuses.map<DropdownItem<VerificationStatus>>((status) => {
      const requiresAdmin = requiresAdminItems.includes(status);
      return {
        label: getTooltipText(status),
        value: status,
        icon: <StatusBadgeIndicator status={status} showTooltip={false} />,
        disabled: requiresAdmin && !isAdmin,
        onClick: () => {
          if (!requiresAdmin || isAdmin) {
            onChangeStatus(status);
          }
        }
      };
    });
  }, [isAdmin, status, onChangeStatus]);

  const onSelect = useMemoizedFn((item: VerificationStatus) => {
    onChangeStatus(item);
  });

  return (
    <Dropdown
      emptyStateText="Nothing to see here..."
      items={items}
      showIndex
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      selectType="single"
      menuHeader="Verification status...">
      {children}
    </Dropdown>
  );
});
StatusDropdownContent.displayName = 'StatusDropdownContent';
