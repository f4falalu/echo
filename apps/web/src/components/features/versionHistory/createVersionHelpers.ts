import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { timeFromNow } from '@/lib/date';
import type { IDropdownItem } from '../../ui/dropdown';
import type { VersionHistoryItem } from './VersionHistoryModal';

export const createVersionHistoryItems = (
  versions: BusterMetric['versions']
): VersionHistoryItem[] => {
  return versions
    .map((version) => ({
      version_number: version.version_number,
      updated_at: timeFromNow(version.updated_at, false),
    }))
    .reverse();
};

export const createVersionHistoryDropdownItems = ({
  versions,
  selectedVersion,
  onClick,
}: {
  versions: BusterMetric['versions'];
  selectedVersion: number | undefined;
  onClick: (versionNumber: number) => void;
}) => {
  return versions
    .map<IDropdownItem>(({ version_number, updated_at }) => ({
      label: `Version ${version_number}`,
      secondaryLabel: timeFromNow(updated_at, false),
      value: version_number.toString(),
      selected: version_number === selectedVersion,
      linkIcon: 'none',
      onClick: () => onClick(version_number),
    }))
    .reverse();
};
