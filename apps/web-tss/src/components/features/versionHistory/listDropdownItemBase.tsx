import type { IDropdownItem } from '@/components/ui/dropdown';
import { timeFromNow } from '@/lib/date';

export const createVersionDropdownItemBase = ({
  version_number,
  updated_at,
  selectedVersion,
}: {
  version_number: number;
  updated_at: string;
  selectedVersion: number | undefined;
}) => {
  const baseParams: IDropdownItem = {
    label: `Version ${version_number}`,
    secondaryLabel: timeFromNow(updated_at, false),
    value: version_number.toString(),
    selected: version_number === selectedVersion,
    linkIcon: 'none',
  };
  return baseParams;
};
