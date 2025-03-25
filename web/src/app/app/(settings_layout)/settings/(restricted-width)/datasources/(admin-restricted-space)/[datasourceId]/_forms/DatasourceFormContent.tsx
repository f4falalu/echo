'use client';

import type { DataSource, DataSourceTypes } from '@/api/asset_interfaces';
import React from 'react';
import { PostgresForm } from './PostgresForm';
import { MySqlForm } from './MySqlForm';
import { BigQueryForm } from './BigQueryForm';
import { SnowflakeForm } from './SnowflakeForm';
import { RedshiftForm } from './RedshiftForm';
import { DataBricksForm } from './DataBricksForm';
import { SqlServerForm } from './SqlServerForm';

const FormRecord: Record<
  DataSourceTypes,
  React.FC<{
    dataSource?: DataSource;
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
  type: DataSourceTypes;
}> = ({ dataSource, type }) => {
  const SelectedForm = FormRecord[type];

  return (
    <div className="rounded-lg border">
      <div className="bg-item-hover flex items-center px-4 py-2.5">Datasource credentials</div>

      <div className="p-4">{SelectedForm && <SelectedForm dataSource={dataSource} />}</div>
    </div>
  );
};
