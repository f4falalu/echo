import { useMemo } from 'react';
import { useDashboardVersionHistoryMode } from '@/layouts/AssetContainer/DashboardAssetContainer';
import type { IDropdownItems } from '../../ui/dropdown';
import { createVersionHistoryDropdownItems } from './createVersionHelpers';

export const useListDashboardVersionDropdownItems = ({
  versions,
  selectedVersion,
}: {
  selectedVersion: number | undefined;
  versions: {
    version_number: number;
    updated_at: string;
  }[];
}) => {
  const { openDashboardVersionHistoryMode } = useDashboardVersionHistoryMode();

  const versionHistoryItems: IDropdownItems = useMemo(() => {
    return createVersionHistoryDropdownItems({
      versions,
      selectedVersion,
      onClick: openDashboardVersionHistoryMode,
    });
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
