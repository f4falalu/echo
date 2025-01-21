import React, { useState } from 'react';
import { Button } from 'antd';
import { Text, Title } from '@/components/text';
import { AppMaterialIcons } from '@/components/icons';
import { NewDatasetModal } from '@appComponents/NewDatasetModal';

export const NoDatasets: React.FC<{ onClose: () => void }> = React.memo(({ onClose }) => {
  const [openNewDatasetModal, setOpenNewDatasetModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center space-y-3 p-3">
        <div className="mt-0 flex w-full flex-col justify-center space-y-3 rounded p-4">
          <Title level={4}>{`You don't have any datasets yet.`}</Title>
          <Text>In order to get started, create a dataset.</Text>

          <Button
            onClick={() => {
              setOpenNewDatasetModal(true);
            }}
            type="default"
            icon={<AppMaterialIcons icon="table_view" />}>
            Create dataset
          </Button>
        </div>
      </div>

      <NewDatasetModal
        open={openNewDatasetModal}
        onClose={() => setOpenNewDatasetModal(false)}
        afterCreate={onClose}
      />
    </>
  );
});
NoDatasets.displayName = 'NoDatasets';
