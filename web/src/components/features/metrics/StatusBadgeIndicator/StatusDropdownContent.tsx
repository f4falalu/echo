import { VerificationStatus } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { getTooltipText } from './helpers';
import { useMemoizedFn } from 'ahooks';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';
import { Dropdown, DropdownItem, DropdownItems } from '@/components/ui/dropdown';

const statuses = [
  VerificationStatus.notRequested,
  VerificationStatus.requested,
  VerificationStatus.inReview,
  VerificationStatus.verified,
  VerificationStatus.backlogged
];

const requiresAdminItems = [
  VerificationStatus.inReview,
  VerificationStatus.verified,
  VerificationStatus.backlogged
];

export const StatusDropdownContent: React.FC<{
  isAdmin: boolean;
  status: VerificationStatus;
  children: React.ReactNode;
  onChangeStatus: (status: VerificationStatus) => void;
}> = React.memo(({ isAdmin, status, onChangeStatus, children }) => {
  const items: DropdownItems<VerificationStatus> = useMemo(() => {
    return statuses.map<DropdownItems<VerificationStatus>[number]>((status, index) => {
      const requiresAdmin = requiresAdminItems.includes(status);
      return {
        index,
        label: getTooltipText(status),
        value: status,
        icon: <StatusBadgeIndicator status={status} />,
        key: status,
        disabled: requiresAdmin && !isAdmin,
        onClick: () => {
          if (!requiresAdmin || isAdmin) {
            onChangeStatus(status);
          }
        }
      };
    });
  }, [isAdmin, status, onChangeStatus]);

  const onSelect = useMemoizedFn((item: DropdownItem<VerificationStatus>) => {
    const _item = item as DropdownItem<VerificationStatus>;
    onChangeStatus(_item.value as VerificationStatus);
  });

  return (
    <Dropdown
      emptyStateText="Nothing to see here..."
      items={items}
      onSelect={(v) => {
        v;
      }}
      selectType="single"
      menuHeader="Status">
      {children}
    </Dropdown>
  );
});
StatusDropdownContent.displayName = 'StatusDropdownContent';
