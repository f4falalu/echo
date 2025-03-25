import { DataSource } from '@/api/asset_interfaces';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createPostgresDataSource,
  useCreatePostgresDataSource,
  useUpdatePostgresDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';

const sshModeOptions = ['Do not use SSH credentials', 'Use SSH credentials'].map((item, index) => ({
  label: item,
  value: index
}));

export const PostgresForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreatePostgresDataSource();
  const { mutateAsync: updateDataSource } = useUpdatePostgresDataSource();

  const form = useAppForm({
    defaultValues: {
      host: '',
      port: 5432,
      username: '',
      password: '',
      default_database: '',
      default_schema: '',
      type: 'postgres' as const,
      name: ''
    } satisfies Parameters<typeof createPostgresDataSource>[0],
    onSubmit: async ({ value, meta }) => {
      if (dataSource) {
        await updateDataSource({ id: dataSource.id, ...value });
      } else {
        await createDataSource(value);
      }
    }
  });

  return (
    <FormWrapper form={form}>
      <form.AppField name="name" children={(field) => <field.TextField label="Name" />} />

      <MultipleInlineFields label="Hostname & port">
        <form.AppField name="host" children={(field) => <field.TextField label="Host" />} />
        <form.AppField name="port" children={(field) => <field.NumberField label="Port" />} />
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password">
        <form.AppField name="username" children={(field) => <field.TextField label="Username" />} />
        <form.AppField
          name="password"
          children={(field) => <field.PasswordField label="Password" />}
        />
      </MultipleInlineFields>

      <form.AppField
        name="default_database"
        children={(field) => <field.TextField label="Database name" />}
      />

      <form.AppField
        name="default_schema"
        children={(field) => <field.TextField label="Schema" />}
      />
    </FormWrapper>
  );
};
