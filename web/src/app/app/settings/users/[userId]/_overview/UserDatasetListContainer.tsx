import React from 'react';
import { BusterUserDataset } from '@/api';

export const UserDatasetListContainer = React.memo(
  ({ filteredDatasets }: { filteredDatasets: BusterUserDataset[] }) => {
    return <div>UserDatasetListContainer</div>;
  }
);

UserDatasetListContainer.displayName = 'UserDatasetListContainer';
