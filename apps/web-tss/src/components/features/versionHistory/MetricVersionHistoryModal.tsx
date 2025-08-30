import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useSaveMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { Button } from '../../ui/buttons';
import { CircleInfo } from '../../ui/icons';
import { createVersionHistoryItems } from './createVersionHelpers';
import {
  type VersionHistoryItem,
  VersionHistoryModal,
  type VersionHistoryModalProps,
} from './VersionHistoryModal';

type MetricVersionHistoryModalProps = Pick<
  VersionHistoryModalProps,
  'onClose' | 'versionNumber'
> & {
  metricId: string;
};

export const MetricVersionHistoryModal = React.memo(
  ({ onClose, versionNumber: versionNumberProp, metricId }: MetricVersionHistoryModalProps) => {
    const [versionNumber, setVersionNumber] = useState<number | false>(versionNumberProp);
    const { data: versions = [] } = useGetMetric(
      { id: metricId },
      { select: useCallback((x: BusterMetric) => x.versions, []) }
    );
    const { mutateAsync: updateMetric, isPending: isRestoringVersion } = useSaveMetric({
      updateOnSave: true,
    });

    const title = 'Metric Version History';
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
      await updateMetric({
        id: metricId,
        restore_to_version: versionNumber,
      });
    });

    useLayoutEffect(() => {
      setVersionNumber(versionNumberProp ?? undefined);
    }, [versionNumberProp]);

    return (
      <VersionHistoryModal
        onClose={onClose}
        versionNumber={versionNumber}
        title={title}
        versionHistoryItems={versionHistoryItems}
        onClickVersion={onClickVersion}
        onClickRestoreVersion={onClickRestoreVersion}
        isRestoringVersion={isRestoringVersion}
        learnMoreButton={learnMoreButton}
      >
        <div>Metric Version History</div>
      </VersionHistoryModal>
    );
  }
);
