'use client';

import type { DataSource } from '@/api/asset_interfaces';
import { PulseLoader } from '@/components/ui/loaders';
import { AppDataSourceIcon } from '@/components/ui/icons/AppDataSourceIcons';
import { formatDate } from '@/lib';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import React from 'react';
import { DataSourceFormContent } from './_DatasourceFormContent';
import { Title, Text } from '@/components/ui/typography';
import { Trash } from '@/components/ui/icons';
import { useDeleteDatasource, useGetDatasource } from '@/api/buster_rest/datasource';

export const DatasourceForm: React.FC<{ datasourceId: string }> = ({ datasourceId }) => {
  const { data: dataSource, isFetched: isFetchedDataSource } = useGetDatasource(datasourceId);

  if (!isFetchedDataSource || !dataSource) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex flex-col space-y-3">
      <DataSourceFormHeader dataSource={dataSource} />
      <DataSourceFormStatus dataSource={dataSource} />
      <DataSourceFormContent dataSource={dataSource} type={dataSource.db_type} />
    </div>
  );
};

const DataSourceFormHeader: React.FC<{ dataSource: DataSource }> = ({ dataSource }) => {
  return (
    <div className="flex justify-between space-x-2">
      <div className="flex space-x-4">
        <div>
          <AppDataSourceIcon size={55} type={dataSource.db_type} />
        </div>

        <div className="flex flex-col space-y-1">
          <Title as="h4">{dataSource.name}</Title>
          <Text variant="secondary">
            Last updated{' '}
            {formatDate({
              date: dataSource.updated_at || dataSource.created_at,
              format: 'LLL'
            })}
          </Text>
        </div>
      </div>

      {/* <ThreeDotsMenu dataSource={dataSource} /> */}
    </div>
  );
};

const DataSourceFormStatus: React.FC<{ dataSource: DataSource }> = ({ dataSource }) => {
  const { mutateAsync: onDeleteDataSource } = useDeleteDatasource();

  const dropdownItems: DropdownItems = [
    {
      value: 'delete',
      label: 'Delete',
      icon: <Trash />,
      onClick: async () => {
        await onDeleteDataSource(dataSource.id);
      }
    }
  ];

  return (
    <div className="flex w-full items-center justify-between space-x-3 rounded border border-gray-300 bg-gray-100 p-4">
      <div className="flex flex-col">
        <Text>Connection status</Text>
        <Text variant="secondary">{`Connected on ${formatDate({
          date: dataSource.created_at,
          format: 'LL'
        })}`}</Text>
      </div>

      <div className="">
        <Dropdown items={dropdownItems}>
          <div className="flex! cursor-pointer items-center space-x-2 pl-2">
            <PulseLoader className="text-success-foreground" size={10} />
            <Text className="select-none">Connected</Text>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

const SkeletonLoader: React.FC = () => {
  return <div>{/* <Skeleton /> */}</div>;
};
