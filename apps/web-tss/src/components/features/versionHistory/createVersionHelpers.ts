import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { timeFromNow } from '@/lib/date';
import type { VersionHistoryItem } from './VersionHistoryModal';

export const createVersionHistoryItems = (
  versions: BusterMetric['versions']
): VersionHistoryItem[] => {
  return versions.map((version) => ({
    version_number: version.version_number,
    updated_at: timeFromNow(version.updated_at, false),
  }));
};
