import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { getTooltipText } from './helpers';
import { useMemoizedFn } from 'ahooks';
import { AppPopoverMenu, AppTooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/buttons';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';
import { StatusDropdownContent } from './StatusDropdownContent';

export const StatusBadgeButton: React.FC<{
  status: BusterMetricListItem['status'];
  id: string | string[];
  disabled?: boolean;
  isAdmin: boolean | undefined;
  variant?: 'default' | 'ghost';
  onVerify: (d: { id: string; status: VerificationStatus }[]) => Promise<void>;
}> = React.memo(
  ({
    isAdmin = false,
    variant = 'ghost',
    id,
    status = VerificationStatus.notRequested,
    onVerify,
    disabled
  }) => {
    const text = useMemo(() => getTooltipText(status), [status]);
    const [isOpenDropdown, setIsOpenDropdown] = React.useState(false);

    const onChangeStatus = useMemoizedFn(async (newStatus: VerificationStatus) => {
      const userStatus = [VerificationStatus.notRequested, VerificationStatus.requested];

      if ((!isAdmin && !userStatus.includes(newStatus)) || newStatus === status) {
        return;
      }
      const ids = Array.isArray(id) ? id : [id];
      const params = ids.map((id) => ({ id, status: newStatus }));
      await onVerify(params);
    });

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

    const showButtonTooltip =
      !isAdmin && status === VerificationStatus.notRequested && !isOpenDropdown;
    const buttonText = Array.isArray(id) ? 'Status' : '';

    return (
      <StatusDropdownContent
        isAdmin={isAdmin}
        status={status}
        onChangeStatus={onChangeStatus}
        onOpenChange={setIsOpenDropdown}>
        <AppTooltip title={showButtonTooltip ? '' : 'Request verification from data team'}>
          <Button
            disabled={disabled || ((!id || status === 'verified') && !isAdmin)}
            prefix={<StatusBadgeIndicator showTooltip={false} status={status} size={16} />}
            variant={variant}>
            {buttonText}
          </Button>
        </AppTooltip>
      </StatusDropdownContent>
    );
  }
);
StatusBadgeButton.displayName = 'StatusBadgeButton';
