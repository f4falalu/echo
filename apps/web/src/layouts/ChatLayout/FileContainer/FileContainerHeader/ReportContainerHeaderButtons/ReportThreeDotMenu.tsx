import React, { useMemo } from 'react';
import { useStartChatFromReport } from './useStartChatFromAsset';
import {
  Dropdown,
  DropdownContent,
  type DropdownItem,
  type DropdownItems
} from '@/components/ui/dropdown';
import { Dots, ShareRight, WandSparkle } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import { useGetReport } from '@/api/buster_rest/reports';
import { getIsEffectiveOwner } from '@/lib/share';
import { ShareMenuContent, getShareAssetConfig } from '@/components/features/ShareMenu';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';

export const ReportThreeDotMenu = React.memo(
  ({
    reportId,
    reportVersionNumber,
    isViewingOldVersion
  }: {
    reportId: string;
    reportVersionNumber: number | undefined;
    isViewingOldVersion: boolean;
  }) => {
    const editWithAI = useEditWithAI({ reportId });
    const shareMenu = useShareMenuSelectMenu({ reportId });
    const saveToLibrary = useSaveToLibrary({ reportId });

    const items: DropdownItems = useMemo(() => {
      return [editWithAI, { type: 'divider' }, shareMenu, saveToLibrary];
    }, [reportId, reportVersionNumber]);

    return (
      <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
        <Button prefix={<Dots />} variant="ghost" data-testid="three-dot-menu-button" />
      </Dropdown>
    );
  }
);

ReportThreeDotMenu.displayName = 'ReportThreeDotMenu';

const useEditWithAI = ({ reportId }: { reportId: string }): DropdownItem => {
  const { onCreateFileClick, loading } = useStartChatFromReport({
    assetId: reportId,
    assetType: 'report'
  });

  return useMemo(
    () => ({
      label: 'Edit with AI',
      value: 'edit-with-ai',
      icon: <WandSparkle />,
      onClick: onCreateFileClick,
      loading
    }),
    [reportId, onCreateFileClick, loading]
  );
};

export const useShareMenuSelectMenu = ({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport({ reportId }, { select: getShareAssetConfig });
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
      label: 'Share metric',
      value: 'share-metric',
      icon: <ShareRight />,
      disabled: !isEffectiveOwner,
      items:
        isEffectiveOwner && shareAssetConfig
          ? [
              <ShareMenuContent
                key={reportId}
                shareAssetConfig={shareAssetConfig}
                assetId={reportId}
                assetType={'report'}
              />
            ]
          : undefined
    }),
    [reportId, shareAssetConfig, isEffectiveOwner]
  );
};

export const useSaveToLibrary = ({ reportId }: { reportId: string }): DropdownItem => {
  //   const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  //   const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  //   const { data: selectedCollections } = useGetMetric(
  //     { id: metricId },
  //     { select: (x) => x.collections?.map((x) => x.id) }
  //   );
  //   const { openInfoMessage } = useBusterNotifications();

  //   const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
  //     await saveMetricToCollection({
  //       metricIds: [metricId],
  //       collectionIds
  //     });
  //     openInfoMessage('Metrics saved to collections');
  //   });

  //   const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
  //     await removeMetricFromCollection({
  //       metricIds: [metricId],
  //       collectionIds: [collectionId]
  //     });
  //     openInfoMessage('Metrics removed from collections');
  //   });

  //   const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
  //     onSaveToCollection,
  //     onRemoveFromCollection,
  //     selectedCollections: selectedCollections || []
  //   });

  const CollectionSubMenu = useMemo(() => {
    return <DropdownContent items={[]} />;
  }, [reportId]);

  return useMemo(
    () => ({
      label: 'Add to collection',
      value: 'add-to-collection',
      icon: <ASSET_ICONS.collectionAdd />,
      items: [<React.Fragment key="collection-sub-menu">{CollectionSubMenu}</React.Fragment>]
    }),
    [CollectionSubMenu]
  );
};
