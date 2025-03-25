import { DataSource, SQLServerCredentials } from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createSQLServerDataSource,
  useCreateSQLServerDataSource,
  useUpdateSQLServerDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useRouter } from 'next/router';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useConfetti } from '@/hooks/useConfetti';

export const SqlServerForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { fireConfetti } = useConfetti();
  const { openSuccessMessage, openConfirmModal } = useBusterNotifications();
  const router = useRouter();
  const { mutateAsync: createDataSource } = useCreateSQLServerDataSource();
  const { mutateAsync: updateDataSource } = useUpdateSQLServerDataSource();
  const credentials = dataSource?.credentials as SQLServerCredentials;

  const flow = dataSource?.id ? 'update' : 'create';

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      port: credentials?.port || 1433,
      username: credentials?.username || '',
      password: credentials?.password || '',
      default_database: credentials?.default_database || '',
      default_schema: credentials?.default_schema || '',
      type: 'sqlserver' as const,
      name: dataSource?.name || credentials?.name || ''
    } satisfies Parameters<typeof createSQLServerDataSource>[0],
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
            placeholder="My SQL Server"
          />
        )}
      />

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField
          name="host"
          children={(field) => <field.TextField label={null} placeholder="sqlserver.example.com" />}
        />
        <form.AppField
          name="port"
          children={(field) => (
            <field.NumberField label={null} placeholder="1433" className="max-w-[75px]!" />
          )}
        />
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField
          name="username"
          children={(field) => <field.TextField label={null} placeholder="sa" />}
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
            placeholder="master"
          />
        )}
      />

      <form.AppField
        name="default_schema"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="dbo" />
        )}
      />
    </FormWrapper>
  );
};
