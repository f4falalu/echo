import { Link, useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  DatabaseNames,
  type DataSourceTypes,
  SUPPORTED_DATASOURCES,
} from '@/api/asset_interfaces/datasources';
import { AppDataSourceIcon } from '@/components/features/icons/dataSourceIcons';
import { Text, Title } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { DataSourceFormContent } from './forms/DatasourceFormContent';
import { HeaderContainer } from './HeaderContainer';

export function DataSourcesAddController({ type }: { type?: DataSourceTypes }) {
  const navigate = useNavigate();
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceTypes | null>(
    getValidType(type)
  );

  const onClearSelectedDataSource = useMemoizedFn(() => {
    setSelectedDataSource(null);
    navigate({ to: '/app/settings/datasources/add' });
  });

  useEffect(() => {
    if (getValidType(type)) {
      setSelectedDataSource(getValidType(type));
    }
  }, [type]);

  return (
    <div className="flex flex-col space-y-5">
      <HeaderContainer
        buttonText={selectedDataSource ? 'Connect a datasource' : 'Datasources'}
        onClick={onClearSelectedDataSource}
        linkUrl={
          selectedDataSource
            ? {
                to: '/app/settings/datasources/add',
              }
            : {
                to: '/app/settings/datasources',
              }
        }
      />

      {selectedDataSource ? (
        <DataSourceFormContent type={selectedDataSource} dataSource={undefined} />
      ) : (
        <div className="flex flex-col space-y-6">
          <ConnectHeader />
          <DataSourceList />
        </div>
      )}
    </div>
  );
}

const ConnectHeader: React.FC = () => {
  return (
    <div className="flex flex-col space-y-1">
      <Title as="h3">{'Connect a datasource'}</Title>
      <Text variant="secondary">{"Select the datasource you'd like to connect"}</Text>
    </div>
  );
};

const DataSourceList: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {SUPPORTED_DATASOURCES.map((dataSource) => {
        const name = DatabaseNames[dataSource];
        return (
          <Link
            to={`/app/settings/datasources/add`}
            search={{
              type: dataSource,
            }}
            key={dataSource}
            className={cn(
              'flex cursor-pointer items-center space-x-4 px-4 py-3 shadow transition',
              'bg-background hover:bg-item-hover',
              'border-border max-h-[48px] rounded border'
            )}
          >
            <AppDataSourceIcon size={28} type={dataSource} />
            <Text>{name}</Text>
          </Link>
        );
      })}
    </div>
  );
};

const getValidType = (type: string | undefined) => {
  return SUPPORTED_DATASOURCES.includes(type as DataSourceTypes) ? (type as DataSourceTypes) : null;
};
