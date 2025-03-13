import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import React from 'react';
import { useMemoizedFn } from '@/hooks';
import { AppTooltip } from '@/components/ui/tooltip';
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
    status = VerificationStatus.NOT_REQUESTED,
    onVerify,
    disabled
  }) => {
    const [isOpenDropdown, setIsOpenDropdown] = React.useState(false);

    const showButtonTooltip =
      !isAdmin && status === VerificationStatus.NOT_REQUESTED && !isOpenDropdown;
    const buttonText = Array.isArray(id) ? 'Status' : '';

    const onChangeStatus = useMemoizedFn(async (newStatus: VerificationStatus) => {
      const userStatus = [VerificationStatus.NOT_REQUESTED, VerificationStatus.REQUESTED];

      if ((!isAdmin && !userStatus.includes(newStatus)) || newStatus === status) {
        return;
      }
      const ids = Array.isArray(id) ? id : [id];
      const params = ids.map((id) => ({ id, status: newStatus }));
      await onVerify(params);
    });

    return (
      <StatusDropdownContent
        isAdmin={isAdmin}
        status={status}
        onChangeStatus={onChangeStatus}
        onOpenChange={setIsOpenDropdown}>
        <AppTooltip title={showButtonTooltip ? '' : 'Request verification from data team'}>
          <Button
            disabled={disabled || ((!id || status === VerificationStatus.VERIFIED) && !isAdmin)}
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
