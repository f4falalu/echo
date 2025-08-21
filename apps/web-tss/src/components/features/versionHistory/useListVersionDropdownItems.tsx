import { useMemo } from 'react';
import { createDropdownItem, type IDropdownItems } from '@/components/ui/dropdown';
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
  const versionHistoryItems: IDropdownItems = useMemo(() => {
    return versions.map(({ version_number, updated_at }) =>
      createDropdownItem({
        label: `Version ${version_number}`,
        secondaryLabel: timeFromNow(updated_at, false),
        value: version_number.toString(),
        selected: version_number === selectedVersion,
        link: {
          to: '/app/home',
        },
      })
    );
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
