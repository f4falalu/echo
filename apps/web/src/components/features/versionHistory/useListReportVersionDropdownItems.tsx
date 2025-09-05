import { useMemo } from 'react';
import { useReportVersionHistoryMode } from '@/layouts/AssetContainer/ReportAssetContainer';
import type { IDropdownItems } from '../../ui/dropdown';
import { createVersionHistoryDropdownItems } from './createVersionHelpers';

export const useListReportVersionDropdownItems = ({
  versions,
  selectedVersion,
}: {
  selectedVersion: number | undefined;
  versions: {
    version_number: number;
    updated_at: string;
  }[];
}) => {
  const { openReportVersionHistoryMode } = useReportVersionHistoryMode();

  const versionHistoryItems: IDropdownItems = useMemo(() => {
    return createVersionHistoryDropdownItems({
      versions,
      selectedVersion,
      onClick: openReportVersionHistoryMode,
    });
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
