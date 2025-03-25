import { DataSource, SnowflakeCredentials } from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createSnowflakeDataSource,
  useCreateSnowflakeDataSource,
  useUpdateSnowflakeDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useConfetti } from '@/hooks/useConfetti';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
export const SnowflakeForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { fireConfetti } = useConfetti();
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);
  const { mutateAsync: createDataSource } = useCreateSnowflakeDataSource();
  const { mutateAsync: updateDataSource } = useUpdateSnowflakeDataSource();
  const credentials = dataSource?.credentials as SnowflakeCredentials;

  const flow = dataSource?.id ? 'update' : 'create';

  const form = useAppForm({
    defaultValues: {
      account_id: credentials?.account_id || '',
      warehouse_id: credentials?.warehouse_id || '',
      username: credentials?.username || '',
      password: credentials?.password || '',
      role: credentials?.role || '',
      default_database: credentials?.default_database || '',
      default_schema: credentials?.default_schema || '',
      type: 'snowflake' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createSnowflakeDataSource>[0],
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
            onChangePage({
              route: BusterRoutes.APP_DATASETS
            });
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
            placeholder="My Snowflake"
          />
        )}
      />

      <form.AppField
        name="account_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Account ID"
            placeholder="YOUR_ACCOUNT_ID"
          />
        )}
      />

      <form.AppField
        name="warehouse_id"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Warehouse ID"
            placeholder="COMPUTE_WH"
          />
        )}
      />

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField
          name="username"
          children={(field) => <field.TextField label={null} placeholder="USERNAME" />}
        />
        <form.AppField
          name="password"
          children={(field) => <field.PasswordField label={null} placeholder="password" />}
        />
      </MultipleInlineFields>

      <form.AppField
        name="role"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Role (optional)"
            placeholder="ACCOUNTADMIN"
          />
        )}
      />

      <form.AppField
        name="default_database"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database name"
            placeholder="SNOWFLAKE_SAMPLE_DATA"
          />
        )}
      />

      <form.AppField
        name="default_schema"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="PUBLIC" />
        )}
      />
    </FormWrapper>
  );
};
