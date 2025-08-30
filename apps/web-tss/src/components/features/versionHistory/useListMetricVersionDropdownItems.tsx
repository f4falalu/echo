import { useMemo } from 'react';
import { useVersionHistoryMode } from '@/layouts/AssetContainer/MetricAssetContainer';
import { createDropdownItem, type IDropdownItems } from '../../ui/dropdown';
import { createVersionDropdownItemBase } from './listDropdownItemBase';

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
  const { openVersionHistoryMode } = useVersionHistoryMode();

  const versionHistoryItems: IDropdownItems = useMemo(() => {
    return versions
      .map(({ version_number, updated_at }) => {
        return createDropdownItem({
          ...createVersionDropdownItemBase({
            version_number,
            updated_at,
            selectedVersion,
          }),
          onClick: () => openVersionHistoryMode(version_number),
        });
      })
      .reverse();
  }, [versions, selectedVersion]);

  return versionHistoryItems;
};
