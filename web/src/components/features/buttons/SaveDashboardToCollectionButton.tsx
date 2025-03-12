import React, { useState } from 'react';
import { SaveToCollectionsDropdown } from '../dropdowns/SaveToCollectionsDropdown';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { CollectionButton } from './CollectionsButton';
import { useGetCollectionsList } from '@/api/buster_rest/collections';

export const SaveDashboardToCollectionButton: React.FC<{
  dashboardIds: string[];
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
}> = React.memo(({ dashboardIds, buttonType = 'ghost', useText = false }) => {
  const { openInfoMessage } = useBusterNotifications();

  const { data: collectionsList } = useGetCollectionsList({});

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);
  const saveDashboardToCollection = useBusterDashboardContextSelector(
    (state) => state.onAddToCollection
  );
  const removeDashboardFromCollection = useBusterDashboardContextSelector(
    (state) => state.onRemoveFromCollection
  );

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

  return (
    <SaveToCollectionsDropdown
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}
      selectedCollections={selectedCollections}>
      <CollectionButton buttonType={buttonType} useText={useText} />
    </SaveToCollectionsDropdown>
  );
});

SaveDashboardToCollectionButton.displayName = 'SaveDashboardToCollectionButton';
