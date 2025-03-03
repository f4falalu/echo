import type { VerificationStatus, BusterMetricListItem } from '@/api/asset_interfaces';

const statusRecordText: Record<VerificationStatus, string> = {
  verified: 'Verified',
  requested: 'Requested',
  inReview: 'In review',
  backlogged: 'Backlogged',
  notVerified: 'Not verified',
  notRequested: 'Not requested'
};

export const getTooltipText = (status: VerificationStatus) => {
  return statusRecordText[status] || statusRecordText.notRequested;
};

export const getShareStatus = ({ is_shared }: { is_shared: BusterMetricListItem['is_shared'] }) => {
  if (is_shared) return 'Shared';
  return 'Private';
};
