'use client';

import { DataSource, BigQueryCredentials } from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createBigQueryDataSource,
  useCreateBigQueryDataSource,
  useUpdateBigQueryDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';

export const BigQueryForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreateBigQueryDataSource();
  const { mutateAsync: updateDataSource } = useUpdateBigQueryDataSource();
  const credentials = dataSource?.credentials as BigQueryCredentials;

  const flow = dataSource?.id ? 'update' : 'create';

  const form = useAppForm({
    defaultValues: {
      service_role_key: credentials?.service_role_key || '',
      default_project_id: credentials?.default_project_id || '',
      default_dataset_id: credentials?.default_dataset_id || '',
      type: 'bigquery' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createBigQueryDataSource>[0],
    onSubmit: async ({ value }) => {
      if (flow === 'update' && dataSource?.id) {
        await updateDataSource({ id: dataSource.id, ...value });
      } else {
        await createDataSource(value);
      }
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My BigQuery" />
        )}
      />

      <form.AppField
        name="service_role_key"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Service Account Key"
            placeholder="Paste your service account key JSON here"
          />
        )}
      />

      <form.AppField
        name="default_project_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Project ID"
            placeholder="your-project-id"
          />
        )}
      />

      <form.AppField
        name="default_dataset_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Dataset ID"
            placeholder="your_dataset"
          />
        )}
      />
    </FormWrapper>
  );
};
