import { AppModal } from '@/components';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputRef } from 'antd';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useCreateDatasetGroup } from '@/api/buster-rest/dataset_groups';
import { SelectedDatasetInput } from './SelectDatasetInput';

interface NewDatasetGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string | null;
  userId?: string;
}

export const NewDatasetGroupModal: React.FC<NewDatasetGroupModalProps> = React.memo(
  ({ isOpen, onClose, datasetId: datasetIdProp, userId }) => {
    const [datasetId, setDatasetId] = useState<string | null>(datasetIdProp);

    const { mutateAsync, isPending } = useCreateDatasetGroup(datasetId || undefined, userId);
    const inputRef = useRef<InputRef>(null);
    const { openInfoMessage } = useBusterNotifications();

    const onSetDatasetId = useMemoizedFn((datasetId: string) => {
      setDatasetId(datasetId);
      inputRef.current?.focus();
    });

    const onCreateNewDatasetGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.input?.value;
      if (!inputValue) {
        openInfoMessage('Please enter a name for the dataset group');
        inputRef.current?.focus();
        return;
      }
      await mutateAsync({
        name: inputValue
      });
      onClose();
    });

    const header = useMemo(() => {
      return {
        title: 'New dataset group',
        description: 'Create a new dataset group'
      };
    }, []);

    const footer = useMemo(() => {
      return {
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose
        },
        primaryButton: {
          text: 'Create dataset group',
          onClick: onCreateNewDatasetGroup,
          loading: isPending,
          disabled: !datasetId
        }
      };
    }, [isPending, datasetId]);

    useEffect(() => {
      if (isOpen && datasetIdProp) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }, [isOpen]);

    return (
      <AppModal open={isOpen} onClose={onClose} header={header} footer={footer}>
        <div className="flex flex-col gap-2.5">
          {isOpen && datasetIdProp === null && (
            <SelectedDatasetInput onSetDatasetId={onSetDatasetId} />
          )}
          <Input ref={inputRef} placeholder="Name of dataset group" />
        </div>
      </AppModal>
    );
  }
);

NewDatasetGroupModal.displayName = 'NewDatasetGroupModal';
