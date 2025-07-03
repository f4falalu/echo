import { useMemo } from 'react';
import { VerificationStatus } from '@/api/asset_interfaces';
import type { DropdownItem, DropdownProps } from '@/components/ui/dropdown';
import { getTooltipText } from './helpers';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';

const statuses = ['notRequested', 'requested', 'inReview', 'verified', 'backlogged'];

const requiresAdminItems = ['inReview', 'verified', 'backlogged'];

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
  }, [isAdmin, selectedStatus, onChangeStatus]);

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
