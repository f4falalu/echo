import React from 'react';
import { type BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { StatusNotRequestedIcon } from '@/components/ui/icons/customIcons/Status_NotRequested';
import { CircleCheck, CircleXmark } from '@/components/ui/icons/NucleoIconFilled';
import { AppTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/classMerge';
import { HalfIcon } from './HalfIcon';
import { getTooltipText } from './helpers';
import { ThreeFourthIcon } from './ThreeFourthIcon';

export const StatusBadgeIndicator: React.FC<{
  status: BusterMetricListItem['status'];
  size?: number;
  className?: string;
  showTooltip?: boolean;
}> = React.memo(({ showTooltip = true, status = 'notRequested', size = 16, className = '' }) => {
  const Icon = getIcon(status);
  const colorClasses = getColorClasses(status);
  const tooltipText = getTooltipText(status);
  const isNotVerified = status === 'notVerified' || 'notRequested';
  const sharedClass = cn('flex items-center justify-center rounded-full', colorClasses);
  return (
    <AppTooltip title={showTooltip ? tooltipText : ''}>
      <div
        className={`rounded-full ${className} ${sharedClass} ${isNotVerified ? '' : ''}`}
        style={{
          width: size,
          height: size
        }}>
        <Icon size={size} />
      </div>
    </AppTooltip>
  );
});
StatusBadgeIndicator.displayName = 'StatusBadgeIndicator';

const statusRecordIcon: Record<VerificationStatus, React.FC<{ size?: number }>> = {
  ['verified']: () => <CircleCheck />,
  ['requested']: () => <HalfIcon />,
  ['inReview']: () => <ThreeFourthIcon />,
  ['backlogged']: () => <CircleXmark />,
  ['notVerified']: () => <StatusNotRequestedIcon />,
  ['notRequested']: () => <StatusNotRequestedIcon />
};

const getIcon = (status: BusterMetricListItem['status']) => {
  return statusRecordIcon[status] || (() => <React.Fragment />);
};

const statusRecordColors: Record<VerificationStatus, string> = {
  ['verified']: 'text-[#34A32D]!',
  ['requested']: 'text-[#F2BE01]!',
  ['inReview']: 'text-[#7C3AED]!',
  ['backlogged']: 'text-icon-color',
  ['notVerified']: 'text-icon-color',
  ['notRequested']: 'text-icon-color'
};

const getColorClasses = (status: BusterMetricListItem['status']) => {
  return statusRecordColors[status] || statusRecordColors['notRequested'];
};
