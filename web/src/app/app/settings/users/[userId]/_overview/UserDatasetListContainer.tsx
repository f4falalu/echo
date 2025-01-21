import React, { useMemo } from 'react';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  InfiniteListContainer
} from '@/components/list';
import { DatasetPermissionOverviewUser } from '@/api/buster-rest';
import { Text } from '@/components/text';

export const UserDatasetListContainer = React.memo(
  ({ filteredDatasets }: { filteredDatasets: any[] }) => {
    const columns: BusterListColumn[] = useMemo(() => [], []);

    const rows: BusterListRowItem[] = useMemo(() => [], []);

    return (
      <InfiniteListContainer>
        <BusterInfiniteList
          columns={columns}
          rows={rows}
          showHeader={false}
          showSelectAll={false}
          emptyState={<EmptyState />}
        />
      </InfiniteListContainer>
    );
  }
);

UserDatasetListContainer.displayName = 'UserDatasetListContainer';

const DatasetLineageCell = React.memo(({ user }: { user: DatasetPermissionOverviewUser }) => {
  return (
    <div className="flex items-center justify-end">
      {/* <PermissionLineageBreadcrumb lineage={user.lineage} canQuery={user.can_query} /> */}
    </div>
  );
});
DatasetLineageCell.displayName = 'DatasetLineageCell';

const EmptyState = React.memo(() => {
  return (
    <div className="py-12">
      <Text type="tertiary">TODO: No datasets found</Text>
    </div>
  );
});
EmptyState.displayName = 'EmptyState';
