import { useLayoutEffect, useMemo, useState } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { Button } from '../../ui/buttons';
import { CircleInfo } from '../../ui/icons';
import { createVersionHistoryItems } from './createVersionHelpers';
import type { VersionHistoryItem } from './VersionHistoryModal';

const stableVersionHistoryItems: VersionHistoryItem[] = [];

export const useVersionHistoryModalCommon = ({
  versionNumber: versionNumberProp,
  versions = stableVersionHistoryItems,
  title = '',
  isRestoringVersion,
  onClose,
  updateAsset,
}: {
  versionNumber: number | false;
  versions: BusterMetric['versions'] | undefined;
  title: string | undefined;
  isRestoringVersion: boolean;
  onClose: () => void;
  updateAsset: (versionNumber: number) => Promise<void>;
}) => {
  const [versionNumber, setVersionNumber] = useState<number | false>(versionNumberProp);

  const learnMoreButton = (
    <Button className="pl-0.5!" size={'small'} prefix={<CircleInfo />} variant={'ghost'}>
      Learn More
    </Button>
  );

  const versionHistoryItems = useMemo<VersionHistoryItem[]>(
    () => createVersionHistoryItems(versions),
    [versions]
  );

  const onClickVersion = useMemoizedFn((versionNumber: number) => {
    setVersionNumber(versionNumber);
  });

  const onClickRestoreVersion = useMemoizedFn(async (versionNumber: number) => {
    if (isRestoringVersion) return;
    await updateAsset(versionNumber);
    onClose();
  });

  useLayoutEffect(() => {
    setVersionNumber(versionNumberProp ?? undefined);
  }, [versionNumberProp]);

  return {
    versionNumber,
    versionHistoryItems,
    onClickVersion,
    onClickRestoreVersion,
    learnMoreButton,
    isRestoringVersion,
    title,
  };
};
