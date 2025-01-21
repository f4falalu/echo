import { useCreatePermissionGroup } from '@/api/buster-rest/permission_groups';
import { AppModal } from '@/components/modal';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputRef, Select } from 'antd';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useGetDatasets } from '@/api';
import { SelectedDatasetInput } from './SelectDatasetInput';
interface NewPermissionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string | null;
}

export const NewPermissionGroupModal: React.FC<NewPermissionGroupModalProps> = React.memo(
  ({ isOpen, onClose, datasetId: datasetIdProp }) => {
    const { mutateAsync, isPending } = useCreatePermissionGroup();
    const inputRef = useRef<InputRef>(null);
    const [datasetId, setDatasetId] = useState<string | null>(datasetIdProp);
    const { openInfoMessage } = useBusterNotifications();

    const onSetDatasetId = useMemoizedFn((datasetId: string) => {
      setDatasetId(datasetId);
      inputRef.current?.focus();
    });

    const onCreateNewPermissionGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.input?.value;
      if (!inputValue || !datasetId) {
        openInfoMessage('Please enter a name for the permission group');
        inputRef.current?.focus();
        return;
      }
      await mutateAsync({
        name: inputValue,
        dataset_id: datasetId
      });
      onClose();
    });

    const header = useMemo(() => {
      return {
        title: 'New permission group',
        description: 'Create a new permission group'
      };
    }, []);

    const footer = useMemo(() => {
      return {
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose
        },
        primaryButton: {
          text: 'Create permission group',
          onClick: onCreateNewPermissionGroup,
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
          <Input
            ref={inputRef}
            placeholder="Name of permission group"
            onPressEnter={onCreateNewPermissionGroup}
          />
        </div>
      </AppModal>
    );
  }
);

NewPermissionGroupModal.displayName = 'NewPermissionGroupModal';
