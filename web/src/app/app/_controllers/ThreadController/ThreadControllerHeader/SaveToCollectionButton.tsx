import { AppMaterialIcons } from '@/components';
import { SaveToCollectionsDropdown } from '@appComponents/Buttons/SaveToCollectionsDropdown';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { IBusterThread } from '@/context/Threads/interfaces';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { Button } from 'antd';
import React, { useMemo } from 'react';

export const SaveToCollectionsButton: React.FC<{
  disabled?: boolean;
  selectedCollections: IBusterThread['collections'];
  threadId: string;
}> = React.memo(({ disabled, selectedCollections, threadId }) => {
  const getInitialCollections = useCollectionsContextSelector((x) => x.getInitialCollections);
  const collectionsList = useCollectionsContextSelector((x) => x.collectionsList);
  const unsubscribeToListCollections = useCollectionsContextSelector(
    (x) => x.unsubscribeToListCollections
  );
  const saveThreadToCollection = useBusterThreadsContextSelector(
    (state) => state.saveThreadToCollection
  );
  const removeThreadFromCollection = useBusterThreadsContextSelector(
    (state) => state.removeThreadFromCollection
  );

  const onSaveToCollection = useMemoizedFn(async (collectionId: string[]) => {
    await saveThreadToCollection({ threadId, collectionIds: [...collectionId] });
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    removeThreadFromCollection({ threadId, collectionId });
  });

  const selectedCollectionsIds = useMemo(() => {
    return selectedCollections.map((d) => d.id);
  }, [selectedCollections]);

  const onClick = useMemoizedFn(() => {
    if (!collectionsList.length) getInitialCollections();
  });

  useMount(() => {
    setTimeout(() => {
      if (!collectionsList.length) getInitialCollections();
    }, 7500);
  });

  useUnmount(() => {
    unsubscribeToListCollections();
  });

  return (
    <SaveToCollectionsDropdown
      selectedCollections={selectedCollectionsIds}
      onSaveToCollection={onSaveToCollection}
      onRemoveFromCollection={onRemoveFromCollection}>
      <Button
        disabled={disabled}
        type="text"
        icon={<AppMaterialIcons icon="note_stack_add" />}
        onClick={onClick}
      />
    </SaveToCollectionsDropdown>
  );
});

SaveToCollectionsButton.displayName = 'SaveToCollectionsButton';
