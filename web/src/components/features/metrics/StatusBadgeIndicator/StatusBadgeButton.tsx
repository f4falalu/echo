import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { getTooltipText } from './helpers';
import { useMemoizedFn } from 'ahooks';
import { AppPopoverMenu, AppTooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/buttons';
import { StatusBadgeIndicator } from './StatusBadgeIndicator';

export const StatusBadgeButton: React.FC<{
  status: BusterMetricListItem['status'];
  id: string | string[];
  disabled?: boolean;
  isAdmin: boolean | undefined;
  onVerify: (d: { id: string; status: VerificationStatus }[]) => Promise<void>;
}> = React.memo(({ isAdmin, id, status = VerificationStatus.notRequested, onVerify, disabled }) => {
  const text = useMemo(() => getTooltipText(status), [status]);
  const [isOpen, setIsOpen] = React.useState(false);

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setIsOpen(open);
  });

  const onChangeStatus = useMemoizedFn(async (newStatus: VerificationStatus) => {
    const userStatus = [VerificationStatus.notRequested, VerificationStatus.requested];

    if ((!isAdmin && !userStatus.includes(newStatus)) || newStatus === status) {
      return;
    }
    const ids = Array.isArray(id) ? id : [id];
    const params = ids.map((id) => ({ id, status: newStatus }));
    await onVerify(params);
    setIsOpen(false);
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

  const selectedItem = useMemo(
    () => items.find((item) => item!.key === status) || items[0],
    [text]
  );

  const showButtonTooltip = !isAdmin && status === VerificationStatus.notRequested;
  const buttonVariant = Array.isArray(id) ? 'default' : 'ghost';
  const buttonText = Array.isArray(id) ? 'Status' : '';

  return (
    // <AppPopoverMenu
    //   items={items}
    //   trigger={['click']}
    //   onOpenChange={onOpenChange}
    //   open={isOpen}
    //   hideCheckbox
    //   doNotSortSelected={true}
    //   disabled={disabled}
    //   destroyPopupOnHide={true}
    //   selectedItems={selectedItem?.key ? [selectedItem.key! as string] : []}
    //   placement="bottomRight"
    //   headerContent={'Verification status...'}>
    <AppTooltip title={showButtonTooltip ? '' : 'Request verification from data team'}>
      <Button
        disabled={disabled || ((!id || status === 'verified') && !isAdmin)}
        prefix={<StatusBadgeIndicator showTooltip={false} status={status} size={14} />}
        variant={buttonVariant}>
        {buttonText}
      </Button>
    </AppTooltip>
    // </AppPopoverMenu>
  );
});
StatusBadgeButton.displayName = 'StatusBadgeButton';
