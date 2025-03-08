'use client';

import type { DataSource, DataSourceTypes } from '@/api/asset_interfaces';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useDataSourceIndividualContextSelector } from '@/context/DataSources/DataSourceIndividualProvider';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import React, { useState } from 'react';
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
  const onUpdateDataSource = useDataSourceIndividualContextSelector(
    (state) => state.onUpdateDataSource
  );
  const onCreateDataSource = useDataSourceIndividualContextSelector(
    (state) => state.onCreateDataSource
  );
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { openConfirmModal } = useBusterNotifications();
  const { fireConfetti } = useConfetti();

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useMemoizedFn(async (credentials: DatasourceCreateCredentials) => {
    setSubmitting(true);
    try {
      const name = credentials.datasource_name;

      if (!useConnection) {
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
          },
          cancelButtonProps: { className: 'hidden!' }
        });
      }
    } catch (error) {
      // TODO: handle error
    }

    setSubmitting(false);
  });

  return (
    <div>
      <div className="bg-item-hover flex items-center rounded-tl-lg rounded-tr-lg border px-4 py-2.5">
        Datasource credentials
      </div>

      {SelectedForm && (
        <SelectedForm
          dataSource={dataSource}
          submitting={submitting}
          onSubmit={onSubmit}
          useConnection={useConnection}
        />
      )}
    </div>
  );
};
