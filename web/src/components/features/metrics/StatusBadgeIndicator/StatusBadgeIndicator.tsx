import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { AppTooltip } from '@/components/ui/tooltip';
import React from 'react';
import { StatusNotRequestedIcon } from '@/assets/svg/Status_NotRequested';
import {
  CircleCheck,
  CircleXmark,
  ProgressCircle1Of4,
  ProgressCircle2Of4
} from '@/components/ui/icons/NucleoIconFilled';
import { getTooltipText } from './helpers';

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
  const Icon = getIcon(status);
  const colorClasses = getColorClasses(status);
  const tooltipText = getTooltipText(status);
  const isNotVerified =
    status === VerificationStatus.notVerified || VerificationStatus.notRequested;
  const sharedClass = `h-[16px] w-[16px] flex items-center justify-center rounded-full ${colorClasses}`;
  const _size = isNotVerified ? size : 16;

  return (
    <AppTooltip title={showTooltip ? tooltipText : ''}>
      <div
        className={`rounded-full ${className} ${sharedClass} ${isNotVerified ? '' : ''}`}
        style={{
          width: _size,
          height: _size
        }}>
        <Icon size={_size} />
      </div>
    </AppTooltip>
  );
};

const statusRecordIcon: Record<VerificationStatus, React.FC<any>> = {
  [VerificationStatus.verified]: () => <CircleCheck />,
  [VerificationStatus.requested]: () => <ProgressCircle1Of4 />, //contrast
  [VerificationStatus.inReview]: () => <ProgressCircle2Of4 />,
  [VerificationStatus.backlogged]: () => <CircleXmark />,
  [VerificationStatus.notVerified]: () => <StatusNotRequestedIcon />,
  [VerificationStatus.notRequested]: () => <StatusNotRequestedIcon />
};

const getIcon = (status: BusterMetricListItem['status']) => {
  return statusRecordIcon[status] || (() => <ProgressCircle2Of4 />);
};

const statusRecordColors: Record<VerificationStatus, string> = {
  verified: 'text-[#34A32D]!',
  requested: 'text-[#F2BE01]!',
  inReview: 'text-[#7C3AED]!',
  backlogged: 'text-[#575859]!',
  notVerified: 'text-[#575859]!',
  notRequested: 'text-[#575859]!'
};

const getColorClasses = (status: BusterMetricListItem['status']) => {
  return statusRecordColors[status] || statusRecordColors.notRequested;
};
