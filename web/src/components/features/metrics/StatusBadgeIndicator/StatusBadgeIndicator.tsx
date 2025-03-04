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
import { cn } from '@/lib/classMerge';
import { HalfIcon } from './HalfIcon';
import { ThreeFourthIcon } from './ThreeFourthIcon';

export const StatusBadgeIndicator: React.FC<{
  status: BusterMetricListItem['status'];
  size?: number;
  className?: string;
  showTooltip?: boolean;
}> = React.memo(
  ({ showTooltip = true, status = VerificationStatus.notRequested, size = 16, className = '' }) => {
    const Icon = getIcon(status);
    const colorClasses = getColorClasses(status);
    const tooltipText = getTooltipText(status);
    const isNotVerified =
      status === VerificationStatus.notVerified || VerificationStatus.notRequested;
    const sharedClass = cn(`flex items-center justify-center rounded-full`, colorClasses);
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
  }
);
StatusBadgeIndicator.displayName = 'StatusBadgeIndicator';

const statusRecordIcon: Record<VerificationStatus, React.FC<any>> = {
  [VerificationStatus.verified]: () => <CircleCheck />,
  [VerificationStatus.requested]: () => <HalfIcon />,
  [VerificationStatus.inReview]: () => <ThreeFourthIcon />,
  [VerificationStatus.backlogged]: () => <CircleXmark />,
  [VerificationStatus.notVerified]: () => <StatusNotRequestedIcon />,
  [VerificationStatus.notRequested]: () => <StatusNotRequestedIcon />
};

const getIcon = (status: BusterMetricListItem['status']) => {
  return statusRecordIcon[status] || (() => <React.Fragment />);
};

const statusRecordColors: Record<VerificationStatus, string> = {
  verified: 'text-[#34A32D]!',
  requested: 'text-[#F2BE01]!',
  inReview: 'text-[#7C3AED]!',
  backlogged: 'text-icon-color',
  notVerified: 'text-icon-color',
  notRequested: 'text-icon-color'
};

const getColorClasses = (status: BusterMetricListItem['status']) => {
  return statusRecordColors[status] || statusRecordColors.notRequested;
};
