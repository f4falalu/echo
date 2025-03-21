'use client';

import type { DataSource, DataSourceTypes } from '@/api/asset_interfaces';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { PostgresForm } from './_forms/PostgresForm';
import { DatasourceCreateCredentials } from '@/api/request_interfaces/datasources';
import { MySqlForm } from './_forms/MySqlForm';
import { BigQueryForm } from './_forms/BigQueryForm';
import { SnowflakeForm } from './_forms/SnowflakeForm';
import { RedshiftForm } from './_forms/RedshiftForm';
import { DataBricksForm } from './_forms/DataBricksForm';
import { useConfetti } from '@/hooks/useConfetti';
import { SqlServerForm } from './_forms/SqlServerForm';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useCreateDatasource, useUpdateDatasource } from '@/api/buster_rest/datasource';

const FormRecord: Record<
  DataSourceTypes,
  React.FC<{
    dataSource?: DataSource;
    useConnection: boolean;
    submitting: boolean;
    onSubmit: (v: DatasourceCreateCredentials) => Promise<void>;
  }>
> = {
  postgres: PostgresForm,
  mysql: MySqlForm,
  bigquery: BigQueryForm,
  snowflake: SnowflakeForm,
  redshift: RedshiftForm,
  mariadb: MySqlForm,
  sqlserver: SqlServerForm,
  databricks: DataBricksForm,
  supabase: PostgresForm,
  athena: () => <></>,
  other: () => <></>
};

export const DataSourceFormContent: React.FC<{
  dataSource?: DataSource;
  useConnection?: boolean;
  type: DataSourceTypes;
}> = ({ dataSource, type, useConnection = false }) => {
  const SelectedForm = FormRecord[type];
  const { mutateAsync: onUpdateDataSource, isPending: isUpdatingDataSource } =
    useUpdateDatasource();
  const { mutateAsync: onCreateDataSource, isPending: isCreatingDataSource } =
    useCreateDatasource();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { openConfirmModal } = useBusterNotifications();
  const { fireConfetti } = useConfetti();

  const onSubmit = useMemoizedFn(async (credentials: DatasourceCreateCredentials) => {
    try {
      const name = credentials.datasource_name;

      if (!useConnection && !isUpdatingDataSource && !isCreatingDataSource) {
        await onUpdateDataSource({
          id: dataSource!.id,
          name,
          credentials
        });
      } else {
        const res = (await onCreateDataSource({
          name,
          type,
          credentials
        })) as DataSource;
        setTimeout(() => {
          fireConfetti(1999);
        }, 170);
        openConfirmModal({
          title: 'Connection successful!',
          content: 'You can now use this data source to create data sets.',
          onOk: () => {
            onChangePage({
              route: BusterRoutes.SETTINGS_DATASOURCES_ID,
              datasourceId: res.id
            });
          }
        });
      }
    } catch (error) {
      // TODO: handle error
    }
  });

  return (
    <div>
      <div className="bg-item-hover flex items-center rounded-tl-lg rounded-tr-lg border px-4 py-2.5">
        Datasource credentials
      </div>

      {SelectedForm && (
        <SelectedForm
          dataSource={dataSource}
          submitting={isUpdatingDataSource || isCreatingDataSource}
          onSubmit={onSubmit}
          useConnection={useConnection}
        />
      )}
    </div>
  );
};
