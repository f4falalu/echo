import { DataSource, DatabricksCredentials } from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createDatabricksDataSource,
  useCreateDatabricksDataSource,
  useUpdateDatabricksDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useRouter } from 'next/router';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useConfetti } from '@/hooks/useConfetti';

export const DataBricksForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { fireConfetti } = useConfetti();
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const router = useRouter();
  const { mutateAsync: createDataSource } = useCreateDatabricksDataSource();
  const { mutateAsync: updateDataSource } = useUpdateDatabricksDataSource();
  const credentials = dataSource?.credentials as DatabricksCredentials;

  const flow = dataSource?.id ? 'update' : 'create';

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      api_key: credentials?.api_key || '',
      warehouse_id: credentials?.warehouse_id || '',
      default_catalog: credentials?.default_catalog || '',
      default_schema: credentials?.default_schema || '',
      type: 'databricks' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createDatabricksDataSource>[0],
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
          <field.TextField
            labelClassName={labelClassName}
            label="Name"
            placeholder="My Databricks"
          />
        )}
      />

      <form.AppField
        name="host"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Host URL"
            placeholder="https://your-instance.cloud.databricks.com"
          />
        )}
      />

      <form.AppField
        name="api_key"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="API Key/Personal Access Token"
            placeholder="dapi123456789abcdef"
          />
        )}
      />

      <form.AppField
        name="warehouse_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Warehouse ID"
            placeholder="your-warehouse-id"
          />
        )}
      />

      <form.AppField
        name="default_catalog"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Default Catalog"
            placeholder="hive_metastore"
          />
        )}
      />

      <form.AppField
        name="default_schema"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Default Schema"
            placeholder="default"
          />
        )}
      />
    </FormWrapper>
  );
};
