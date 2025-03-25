import { DataSource, MySQLCredentials } from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createMySQLDataSource,
  useCreateMySQLDataSource,
  useUpdateMySQLDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes } from '@/routes/busterRoutes';
import { useConfetti } from '@/hooks/useConfetti';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export const MySqlForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { fireConfetti } = useConfetti();
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const onChangePage = useAppLayoutContextSelector((state) => state.onChangePage);
  const { mutateAsync: createDataSource } = useCreateMySQLDataSource();
  const { mutateAsync: updateDataSource } = useUpdateMySQLDataSource();
  const credentials = dataSource?.credentials as MySQLCredentials;

  const flow = dataSource?.id ? 'update' : 'create';

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      port: credentials?.port || 3306,
      username: credentials?.username || '',
      password: (dataSource?.credentials as any)?.password || '',
      default_database: (dataSource?.credentials as any)?.default_database || '',
      type: 'mysql' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createMySQLDataSource>[0],
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
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My MySQL" />
        )}
      />

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField
          name="host"
          children={(field) => <field.TextField label={null} placeholder="mysql.example.com" />}
        />
        <form.AppField
          name="port"
          children={(field) => (
            <field.NumberField label={null} placeholder="3306" className="max-w-[75px]!" />
          )}
        />
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField
          name="username"
          children={(field) => <field.TextField label={null} placeholder="root" />}
        />
        <form.AppField
          name="password"
          children={(field) => <field.PasswordField label={null} placeholder="password" />}
        />
      </MultipleInlineFields>

      <form.AppField
        name="default_database"
        children={(field) => (
          <field.TextField
            labelClassName={labelClassName}
            label="Database name"
            placeholder="mydatabase"
          />
        )}
      />
    </FormWrapper>
  );
};
