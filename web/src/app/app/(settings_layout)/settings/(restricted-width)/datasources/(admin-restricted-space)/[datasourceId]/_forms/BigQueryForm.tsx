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
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useRouter } from 'next/router';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useConfetti } from '@/hooks/useConfetti';

export const BigQueryForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { fireConfetti } = useConfetti();
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const router = useRouter();
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
        openSuccessMessage('Datasource updated');
      } else {
        await createDataSource(value);
        fireConfetti(9999);
        openConfirmModal({
          title: 'Datasource created',
          description: 'Datasource created successfully',
          content:
            'Hooray! Your datasource has been created. You can now use it in your projects. You will need to create datasets to use with it.',
          onOk: () => {
            router.push(createBusterRoute({ route: BusterRoutes.APP_DATASETS }));
          }
        });
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
