import { useMemo } from 'react';
import type { FileType } from '@/api/asset_interfaces/chat';
import type { DropdownItems } from '@/components/ui/dropdown';
import { timeFromNow } from '@/lib/date';

export const useListVersionDropdownItems = ({
  versions,
  selectedVersion,
}: {
  selectedVersion: number | undefined;
  versions: {
    version_number: number;
    updated_at: string;
  }[];
}) => {
  console.warn('TODO: add link to version history');
  const versionHistoryItems: DropdownItems = useMemo(() => {
    return versions.map(({ version_number, updated_at }) => ({
      label: `Version ${version_number}`,
      secondaryLabel: timeFromNow(updated_at, false),
      value: version_number.toString(),
      selected: version_number === selectedVersion,
      link: {
        to: '/app/home',
      },
    }));
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
