import { VerificationStatus } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { getTooltipText } from './helpers';
import { useMemoizedFn } from '@/hooks';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';
import { Dropdown, DropdownItem, DropdownProps } from '@/components/ui/dropdown';

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
  const dropdownProps = useStatusDropdownContent({
    isAdmin,
    selectedStatus: status,
    onChangeStatus
  });

  return (
    <Dropdown {...dropdownProps} onOpenChange={onOpenChange}>
      {children}
    </Dropdown>
  );
});
StatusDropdownContent.displayName = 'StatusDropdownContent';

export const useStatusDropdownContent = ({
  isAdmin,
  selectedStatus,
  onChangeStatus
}: {
  isAdmin: boolean;
  selectedStatus: VerificationStatus;
  onChangeStatus: (status: VerificationStatus) => void;
}): Pick<
  DropdownProps<VerificationStatus>,
  'showIndex' | 'items' | 'emptyStateText' | 'menuHeader' | 'selectType'
> => {
  const items = useMemo(() => {
    return statuses.map<DropdownItem<VerificationStatus>>((status) => {
      const requiresAdmin = requiresAdminItems.includes(status);
      return {
        label: getTooltipText(status),
        value: status,
        icon: <StatusBadgeIndicator status={status} showTooltip={false} />,
        disabled: requiresAdmin && !isAdmin,
        selected: status === selectedStatus,
        onClick: () => {
          if (!requiresAdmin || isAdmin) {
            onChangeStatus(status);
          }
        }
      };
    });
  }, [isAdmin, status, onChangeStatus]);

  return useMemo(
    () => ({
      emptyStateText: 'Nothing to see here...',
      menuHeader: 'Verification status...',
      items,
      selectType: 'single',
      showIndex: true
    }),
    [items]
  );
};
