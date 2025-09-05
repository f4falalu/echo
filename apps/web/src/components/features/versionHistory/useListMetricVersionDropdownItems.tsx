import { useMemo } from 'react';
import { useMetricVersionHistoryMode } from '@/layouts/AssetContainer/MetricAssetContainer';
import type { IDropdownItems } from '../../ui/dropdown';
import { createVersionHistoryDropdownItems } from './createVersionHelpers';

export const useListMetricVersionDropdownItems = ({
  versions,
  selectedVersion,
}: {
  selectedVersion: number | undefined;
  versions: {
    version_number: number;
    updated_at: string;
  }[];
}) => {
  const { openMetricVersionHistoryMode } = useMetricVersionHistoryMode();

  const versionHistoryItems: IDropdownItems = useMemo(() => {
    return createVersionHistoryDropdownItems({
      versions,
      selectedVersion,
      onClick: openMetricVersionHistoryMode,
    });
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
