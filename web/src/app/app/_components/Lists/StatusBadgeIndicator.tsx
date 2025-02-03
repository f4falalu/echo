'use client';

import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { AppMaterialIcons, AppPopoverMenu, AppTooltip } from '@/components';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useUserConfigContextSelector } from '@/context/Users';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import React, { useMemo, useState } from 'react';
import { StatusNotRequestedIcon } from '@/assets';

export const StatusBadgeButton: React.FC<{
  status: BusterMetricListItem['status'];
  type: 'metric' | 'dashboard';
  id: string | string[];
  disabled?: boolean;
  onChangedStatus?: () => Promise<void>;
}> = React.memo(
  ({ type, id, status = VerificationStatus.notRequested, onChangedStatus, disabled }) => {
    const onVerifiedDashboard = useDashboardContextSelector((state) => state.onVerifiedDashboard);
    const onVerifiedMetric = useBusterMetricsContextSelector((state) => state.onVerifiedMetric);
    const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
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
      const verifyFunction =
        type === 'dashboard'
          ? (id: string) => onVerifiedDashboard({ dashboardId: id, status: newStatus })
          : (id: string) => onVerifiedMetric({ metricId: id, status: newStatus });

      const ids = Array.isArray(id) ? id : [id];
      await Promise.all(ids.map(verifyFunction));
      setIsOpen(false);
      onChangedStatus?.();
    });

    const items = useMemo(
      () =>
        [
          {
            label: getTooltipText(VerificationStatus.notRequested),
            icon: <StatusBadgeIndicator status={VerificationStatus.notRequested} />,
            key: VerificationStatus.notRequested,
            onClick: () => {
              onChangeStatus(VerificationStatus.notRequested);
            }
          },
          {
            label: getTooltipText(VerificationStatus.requested),
            icon: <StatusBadgeIndicator status={VerificationStatus.requested} />,
            key: VerificationStatus.requested,
            onClick: () => {
              onChangeStatus(VerificationStatus.requested);
            }
          },
          {
            label: getTooltipText(VerificationStatus.inReview),
            icon: <StatusBadgeIndicator status={VerificationStatus.inReview} />,
            key: VerificationStatus.inReview,
            disabled: !isAdmin,
            onClick: () => {
              isAdmin && onChangeStatus(VerificationStatus.inReview);
            }
          },
          {
            label: getTooltipText(VerificationStatus.verified),
            icon: <StatusBadgeIndicator status={VerificationStatus.verified} />,
            key: VerificationStatus.verified,
            disabled: !isAdmin,
            onClick: () => {
              isAdmin && onChangeStatus(VerificationStatus.verified);
            }
          },
          {
            label: getTooltipText(VerificationStatus.backlogged),
            icon: <StatusBadgeIndicator status={VerificationStatus.backlogged} />,
            key: VerificationStatus.backlogged,
            disabled: !isAdmin,
            onClick: () => {
              isAdmin && onChangeStatus(VerificationStatus.backlogged);
            }
          }
        ].map((item, index) => ({
          index,
          ...item
        })),
      [isAdmin, status]
    );

    const selectedItem = useMemo(
      () => items.find((item) => item!.key === status) || items[0],
      [text]
    );

    return (
      <AppPopoverMenu
        items={items}
        trigger={['click']}
        onOpenChange={onOpenChange}
        open={isOpen}
        hideCheckbox
        doNotSortSelected={true}
        disabled={disabled}
        destroyPopupOnHide={true}
        selectedItems={selectedItem?.key ? [selectedItem.key! as string] : []}
        placement="bottomRight"
        headerContent={'Verification status...'}>
        <AppTooltip title={isOpen ? '' : 'Request verification from data team'}>
          <Button
            disabled={disabled || ((!id || status === 'verified') && !isAdmin)}
            icon={<StatusBadgeIndicator showTooltip={false} status={status} size={14} />}
            type={Array.isArray(id) ? 'default' : 'text'}>
            {Array.isArray(id) ? 'Status' : ''}
          </Button>
        </AppTooltip>
      </AppPopoverMenu>
    );
  }
);
StatusBadgeButton.displayName = 'StatusBadgeButton';

export const StatusBadgeIndicator: React.FC<{
  status: BusterMetricListItem['status'];
  size?: number;
  className?: string;
  showTooltip?: boolean;
}> = ({
  showTooltip = true,
  status = VerificationStatus.notRequested,
  size = 16,
  className = ''
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const Icon = getIcon(status);
  const colorClasses = getColorClasses(status);
  const tooltipText = getTooltipText(status);
  const isNotVerified =
    status === VerificationStatus.notVerified || VerificationStatus.notRequested;
  const sharedClass = `h-[16px] w-[16px] flex items-center justify-center rounded-full ${colorClasses}`;
  const _size = isNotVerified ? size : 16;

  const mouseEvents = showTooltip
    ? { onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false) }
    : {};

  return (
    <AppTooltip title={showTooltip && isHovering ? tooltipText : ''} mouseEnterDelay={0.25}>
      <div
        {...mouseEvents}
        className={`rounded-full ${className} ${sharedClass} ${isNotVerified ? '' : ''}`}
        style={{
          width: _size,
          height: _size
        }}>
        <Icon size={_size * 1} />
      </div>
    </AppTooltip>
  );
};

const statusRecordIcon: Record<VerificationStatus, React.FC<any>> = {
  [VerificationStatus.verified]: () => <AppMaterialIcons icon="check_circle" fill />,
  [VerificationStatus.requested]: () => <AppMaterialIcons icon="contrast" />, //contrast
  [VerificationStatus.inReview]: () => <AppMaterialIcons icon="timelapse" />,
  [VerificationStatus.backlogged]: () => <AppMaterialIcons icon="cancel" fill />,
  [VerificationStatus.notVerified]: () => <StatusNotRequestedIcon />,
  [VerificationStatus.notRequested]: () => <StatusNotRequestedIcon />
};
const getIcon = (status: BusterMetricListItem['status']) => {
  return statusRecordIcon[status] || (() => <AppMaterialIcons icon="motion_photos_on" />);
};

const statusRecordColors: Record<VerificationStatus, string> = {
  verified: '!text-[#34A32D]',
  requested: '!text-[#F2BE01]',
  inReview: '!text-[#7C3AED]',
  backlogged: '!text-[#575859]',
  notVerified: '!text-[#575859]',
  notRequested: '!text-[#575859]'
};
const getColorClasses = (status: BusterMetricListItem['status']) => {
  return statusRecordColors[status] || statusRecordColors.notRequested;
};

const statusRecordText: Record<VerificationStatus, string> = {
  verified: 'Verified',
  requested: 'Requested',
  inReview: 'In review',
  backlogged: 'Backlogged',
  notVerified: 'Not verified',
  notRequested: 'Not requested'
};

const getTooltipText = (status: VerificationStatus) => {
  return statusRecordText[status] || statusRecordText.notRequested;
};

export const getShareStatus = ({ is_shared }: { is_shared: BusterMetricListItem['is_shared'] }) => {
  if (is_shared) return 'Shared';
  return 'Private';
};
