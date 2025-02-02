import { AppMaterialIcons } from '@/components/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemoizedFn, useMount } from 'ahooks';
import { Button } from 'antd';
import React, { useState } from 'react';
import { SaveToCollectionsDropdown } from '../Dropdowns/SaveToCollectionsDropdown';

export const SaveMetricToCollectionButton: React.FC<{
  metricIds: string[];
  buttonType?: 'text' | 'default';
  useText?: boolean;
}> = ({ metricIds, buttonType = 'text', useText = false }) => {
  const { openInfoMessage } = useBusterNotifications();
  const saveMetricToCollection = useBusterMetricsContextSelector(
    (state) => state.saveMetricToCollection
  );
  const removeMetricFromCollection = useBusterMetricsContextSelector(
    (state) => state.removeMetricFromCollection
  );

  const collectionsList = useCollectionsContextSelector((state) => state.collectionsList);
  const getInitialCollections = useCollectionsContextSelector(
    (state) => state.getInitialCollections
  );

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    // const allSaves: Promise<void>[] = metricIds.map((metricId) => {
    //   return saveMetricToCollection({
    //     metricId,
    //     collectionIds
    //   });
    // });
    // await Promise.all(allSaves);
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    setSelectedCollections((prev) => prev.filter((id) => id !== collectionId));
    // const allSelectedButLast = selectedRowKeys.slice(0, -1);
    // const lastMetricId = selectedRowKeys[selectedRowKeys.length - 1];
    // const allRemoves: Promise<void>[] = allSelectedButLast.map((metricId) => {
    //   return removeMetricFromCollection({ metricId, collectionId, ignoreFavoriteUpdates: true });
    // });
    // await removeMetricFromCollection({
    //   metricId: lastMetricId,
    //   collectionId,
    //   ignoreFavoriteUpdates: false
    // });
    // await Promise.all(allRemoves);
    openInfoMessage('Metrics removed from collections');
  });

  useMount(() => {
    if (!collectionsList.length) getInitialCollections();
  });

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <Button icon={<AppMaterialIcons icon="note_stack" />} type={buttonType}>
        {useText ? 'Collections' : ''}
      </Button>
    </SaveToCollectionsDropdown>
  );
};
