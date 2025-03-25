import { DataSource } from '@/api/asset_interfaces';
import React, { useRef } from 'react';
import { FormWrapperHandle } from './FormWrapper';
import { formatDate } from '@/lib';
import { DatasourceCreateCredentials } from '@/api/request_interfaces/datasources';
import { useHotkeys } from 'react-hotkeys-hook';
import { useForm } from '@tanstack/react-form';
import {
  createPostgresDataSource,
  useCreatePostgresDataSource,
  useUpdatePostgresDataSource
} from '@/api/buster_rest/data_source';

const sshModeOptions = ['Do not use SSH credentials', 'Use SSH credentials'].map((item, index) => ({
  label: item,
  value: index
}));

type PostgresCreateParams = Parameters<typeof createPostgresDataSource>[0];

export const PostgresForm: React.FC<{
  dataSource?: DataSource;
  useConnection: boolean;
}> = ({ dataSource, useConnection = false }) => {
  const form = useForm({
    defaultValues: {
      host: '',
      port: 5432,
      username: '',
      password: '',
      default_database: '',
      default_schema: '',
      type: 'postgres',
      name: ''
    } satisfies PostgresCreateParams
  });

  return <></>;

  // return (
  //   <FormWrapper
  //     name="postgres"
  //     ref={formRef}
  //     useConnection={useConnection}
  //     dataSource={dataSource}
  //     submitting={submitting}
  //     onSubmit={(v) => {
  //       onSubmit(v as PostgresCreateCredentials);
  //     }}>
  //     <Form.Item label="Hostname & port">
  //       <Form.Item
  //         name="host"
  //         rules={[{ required: true }]}
  //         style={{ display: 'inline-block', width: 'calc(75% - 8px)' }}>
  //         <Input placeholder="Hostname" />
  //       </Form.Item>
  //       <Form.Item
  //         name="port"
  //         rules={[{ required: true }]}
  //         initialValue={5432}
  //         style={{ display: 'inline-block', width: 'calc(25% - 0px)', marginLeft: '8px' }}>
  //         <InputNumber placeholder="5432" />
  //       </Form.Item>
  //     </Form.Item>

  //     <Form.Item label="Username & password">
  //       <Form.Item
  //         name="username"
  //         rules={[{ required: true }]}
  //         style={{ display: 'inline-block', width: 'calc(50% - 0px)' }}>
  //         <Input placeholder="Username" />
  //       </Form.Item>
  //       <Form.Item
  //         name="password"
  //         rules={[{ required: true }]}
  //         style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginLeft: '8px' }}>
  //         <Input.Password placeholder="Password" />
  //       </Form.Item>
  //     </Form.Item>

  //     <Form.Item name="database" label="Database name" rules={[{ required: true }]}>
  //       <Input placeholder="Database name" />
  //     </Form.Item>

  //     <Form.Item name="schemas" label="Schemas" rules={[{ required: true }]}>
  //       <TagInput className="w-full" placeholder="Schemas" />
  //     </Form.Item>

  //     <Form.Item name="ssh" label="SSH" initialValue={sshModeOptions[0].value}>
  //       <Select className="w-full" defaultActiveFirstOption options={sshModeOptions} />
  //     </Form.Item>
  //   </FormWrapper>
  // );
};
