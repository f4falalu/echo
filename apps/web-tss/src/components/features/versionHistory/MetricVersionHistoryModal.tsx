import React, { useCallback, useMemo } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric } from '@/api/buster_rest/metrics';
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
  ({ onClose, versionNumber, metricId }: MetricVersionHistoryModalProps) => {
    const { data: versions = [] } = useGetMetric(
      { id: metricId },
      { select: useCallback((x: BusterMetric) => x.versions, []) }
    );

    const restoringVersion = null;
    const title = 'Metric Version History';
    const learnMoreButton = (
      <Button className="pl-0.5!" size={'small'} prefix={<CircleInfo />} variant={'ghost'}>
        Learn More
      </Button>
    );

    const versionHistoryItems = useMemo<VersionHistoryItem[]>(
      () =>
        createVersionHistoryItems(
          Array.from({ length: 100 }, (_, i) => ({
            version_number: i + 1,
            updated_at: new Date().toISOString(),
            selected: false,
            onClickVersion: () => {},
            onClickRestoreVersion: () => {},
          }))
        ),
      [versions]
    );

    const onClickVersion = useMemoizedFn((versionNumber: number) => {
      //
    });

    const onClickRestoreVersion = useMemoizedFn((versionNumber: number) => {
      //
    });

    return (
      <VersionHistoryModal
        onClose={onClose}
        versionNumber={versionNumber}
        title={title}
        versionHistoryItems={versionHistoryItems}
        onClickVersion={onClickVersion}
        onClickRestoreVersion={onClickRestoreVersion}
        restoringVersion={restoringVersion}
        learnMoreButton={learnMoreButton}
      >
        <div>Metric Version History</div>
      </VersionHistoryModal>
    );
  }
);
