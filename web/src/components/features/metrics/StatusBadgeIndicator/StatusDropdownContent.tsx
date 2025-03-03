import { VerificationStatus } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { getTooltipText } from './helpers';
import { useMemoizedFn } from 'ahooks';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';

export const StatusDropdownContent: React.FC<{
  isAdmin: boolean;
  status: VerificationStatus;
  onChangeStatus: (status: VerificationStatus) => void;
}> = React.memo(({ isAdmin, status, onChangeStatus }) => {
  const items = useMemo(() => {
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
    return statuses.map((status, index) => {
      const requiresAdmin = requiresAdminItems.includes(status);
      return {
        index,
        label: getTooltipText(status),
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

  return <div>StatusDropdownContent</div>;
});
