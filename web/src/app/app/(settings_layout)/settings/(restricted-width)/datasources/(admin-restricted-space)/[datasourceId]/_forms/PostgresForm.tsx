import {
  DataSource,
  PostgresCredentials,
  PostgresCredentialsSchema
} from '@/api/asset_interfaces/datasources';
import React from 'react';
import { FormWrapper } from './FormWrapper';
import {
  createPostgresDataSource,
  useCreatePostgresDataSource,
  useUpdatePostgresDataSource
} from '@/api/buster_rest/data_source';
import { useAppForm } from '@/components/ui/form/useFormBaseHooks';
import { MultipleInlineFields } from '@/components/ui/form/FormBase';
import { useDataSourceFormSuccess } from './helpers';
import * as v from 'valibot';
import { useForm } from '@tanstack/react-form';

const ValibotSchema = v.object({
  // firstName: v.pipe(
  //   v.string(),
  //   v.minLength(3, '[Valibot] You must have a length of at least 3'),
  //   v.startsWith('A', "[Valibot] First name must start with 'A'")
  // ),
  // lastName: v.pipe(v.string(), v.minLength(3, '[Valibot] You must have a length of at least 3'))
  name: v.string(),
  type: v.union([v.literal('postgres'), v.literal('supabase')]),
  host: v.string(),
  port: v.pipe(
    v.number(),
    v.minValue(1, 'Port must be greater than 0'),
    v.maxValue(65535, 'Port must be less than or equal to 65535')
  ),
  username: v.string(),
  password: v.string(),
  default_database: v.string(), // postgres
  default_schema: v.string() // public
});

export const PostgresForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const { mutateAsync: createDataSource } = useCreatePostgresDataSource();
  const { mutateAsync: updateDataSource } = useUpdatePostgresDataSource();
  const credentials = dataSource?.credentials as PostgresCredentials | undefined;

  const flow = dataSource?.id ? 'update' : 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form = useAppForm({
    defaultValues: {
      host: credentials?.host || '',
      port: credentials?.port || 5432,
      username: credentials?.username || '',
      password: credentials?.password || '',
      default_database: credentials?.default_database || '',
      default_schema: credentials?.default_schema || '',
      type: 'postgres',
      name: dataSource?.name || credentials?.name || ''
    } as Parameters<typeof createPostgresDataSource>[0],
    onSubmit: async ({ value }) => {
      await dataSourceFormSubmit({
        flow,
        dataSourceId: dataSource?.id,
        onUpdate: () => updateDataSource({ id: dataSource!.id, ...value }),
        onCreate: () => createDataSource(value)
      });
    },
    validators: {
      //  onChangeAsyncDebounceMs: 1000,
      onChange: PostgresCredentialsSchema
    }
  });

  const labelClassName = 'min-w-[175px]';

  return (
    <FormWrapper form={form} flow={flow}>
      <form.AppField
        name="name"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Name" placeholder="My Postgres" />
        )}
      />

      <MultipleInlineFields label="Hostname & port" labelClassName={labelClassName}>
        <form.AppField
          name="host"
          children={(field) => <field.TextField label={null} placeholder="www.example.com" />}
        />
        <form.AppField
          name="port"
          children={(field) => (
            <field.NumberField label={null} placeholder="5432" className="max-w-[75px]!" />
          )}
        />
      </MultipleInlineFields>

      <MultipleInlineFields label="Username & password" labelClassName={labelClassName}>
        <form.AppField
          name="username"
          children={(field) => <field.TextField label={null} placeholder="postgres" />}
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
            placeholder="postgres"
          />
        )}
      />

      <form.AppField
        name="default_schema"
        children={(field) => (
          <field.TextField labelClassName={labelClassName} label="Schema" placeholder="public" />
        )}
      />
    </FormWrapper>
  );
};

const Test2 = () => {
  const flow = 'create';
  const dataSourceFormSubmit = useDataSourceFormSuccess();

  const form2 = useForm({
    defaultValues: {
      host: 'test',
      port: 5432,
      username: 'test',
      password: 'test',
      default_database: 'test',
      default_schema: 'test',
      type: 'postgres',
      name: 'test'
    } satisfies Parameters<typeof createPostgresDataSource>[0],
    onSubmit: async ({ value }) => {
      await dataSourceFormSubmit({
        flow,
        dataSourceId: '123',
        onUpdate: async () => {},
        onCreate: async () => {}
      });
    },
    validators: {
      // DEMO: You can switch between schemas seamlessly
      //  onChange: ZodSchema,
      onChange: ValibotSchema
      // onChange: ArkTypeSchema,
    }
  });

  return <div>Test2</div>;
};
