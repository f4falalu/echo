import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
import { SaveToCollectionsDropdown } from '../dropdowns/SaveToCollectionsDropdown';
import { CollectionButton } from './CollectionsButton';
import {
  useRemoveMetricFromCollection,
  useSaveMetricToCollections
} from '@/api/buster_rest/metrics';

export const SaveMetricToCollectionButton: React.FC<{
  metricIds: string[];
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
}> = ({ metricIds, buttonType = 'ghost', useText = false }) => {
  const { openInfoMessage } = useBusterNotifications();
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();

  const [selectedCollections, setSelectedCollections] = useState<
    Parameters<typeof SaveToCollectionsDropdown>[0]['selectedCollections']
  >([]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    setSelectedCollections(collectionIds);
    await saveMetricToCollection({
      metricIds,
      collectionIds
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeMetricFromCollection({
      metricIds,
      collectionIds: [collectionId]
    });
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
};
