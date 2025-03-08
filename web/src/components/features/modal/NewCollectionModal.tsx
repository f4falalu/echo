'use client';

import React, { useEffect, useMemo } from 'react';
import { AppModal } from '@/components/ui/modal';
import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { inputHasText } from '@/lib/text';
import { useMemoizedFn } from '@/hooks';
import { Input } from '@/components/ui/inputs';

export const NewCollectionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  useChangePage?: boolean;
  onCollectionCreated?: (collectionId: string) => Promise<void>;
}> = React.memo(({ onCollectionCreated, onClose, open, useChangePage = true }) => {
  const [title, setTitle] = React.useState('');
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const createNewCollection = useBusterCollectionIndividualContextSelector(
    (x) => x.createNewCollection
  );
  const isCreatingCollection = useBusterCollectionIndividualContextSelector(
    (x) => x.isCreatingCollection
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const disableSubmit = !inputHasText(title);

  const memoizedHeader = useMemo(() => {
    return {
      title: 'New collection',
      description: 'Once created, you will be able to add dashboards and metric to the collection'
    };
  }, []);

  const onCreateNewCollection = useMemoizedFn(async () => {
    if (isCreatingCollection || disableSubmit) return;
    const res = await createNewCollection({ name: title, onCollectionCreated });
    if (useChangePage) {
      onChangePage({
        route: BusterRoutes.APP_COLLECTIONS_ID,
        collectionId: (res as any).id
      });
    }
    setTimeout(() => {
      onClose();
    }, 200);
  });

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Create a collection',
        onClick: onCreateNewCollection,
        loading: isCreatingCollection,
        disabled: disableSubmit
      }
    };
  }, [isCreatingCollection, disableSubmit]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [open]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <Input
        ref={inputRef}
        placeholder="Collection title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={onCreateNewCollection}
      />
    </AppModal>
  );
});
NewCollectionModal.displayName = 'NewCollectionModal';
