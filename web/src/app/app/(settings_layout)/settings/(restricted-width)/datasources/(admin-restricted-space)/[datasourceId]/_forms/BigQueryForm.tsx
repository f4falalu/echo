'use client';

import React, { useMemo, useRef, useState } from 'react';
import { FormWrapperHandle } from './FormWrapper';
import type { DataSource } from '@/api/asset_interfaces';
import type {
  BigQueryCreateCredentials,
  DatasourceCreateCredentials
} from '@/api/request_interfaces/datasources';
import { useBusterNotifications } from '@/context/BusterNotifications';
// import { useBusterNotifications } from '@/context/BusterNotifications';

type RawBigQueryCreateCredentials = Omit<BigQueryCreateCredentials, 'credentials_json'> & {
  credentials_json: string;
};

export const BigQueryForm: React.FC<{
  dataSource?: DataSource;
}> = ({ dataSource }) => {
  const formRef = useRef<FormWrapperHandle>(null);
  const [creds, setCreds] = useState('');
  const { openErrorNotification } = useBusterNotifications();

  const isValidJson = useMemo(() => {
    if (!creds) return true;
    try {
      JSON.parse(creds);
      return true;
    } catch (error) {
      return false;
    }
  }, [creds]);

  return <></>;

  // return (
  //   <FormWrapper
  //     name="bigquery"
  //     ref={formRef}
  //     useConnection={useConnection}
  //     dataSource={dataSource}
  //     submitting={submitting}
  //     onSubmit={(v) => {
  //       const value = v as unknown as RawBigQueryCreateCredentials;
  //       if (!creds) {
  //         openErrorNotification({ title: 'Credentials are required' });
  //         return;
  //       }
  //       try {
  //         const parsedCredentials = JSON.parse(creds);
  //         onSubmit({ ...value, credentials_json: parsedCredentials });
  //       } catch (error) {
  //         openErrorNotification({ title: 'Invalid credentials JSON' });
  //       }
  //     }}>
  //     <Form.Item name="project_id" label="Project ID" rules={[{ required: true }]}>
  //       <Input />
  //     </Form.Item>
  //     <Form.Item name="dataset_ids" label="Dataset IDs" rules={[{ required: true }]}>
  //       <AppSelectTagInput className="w-full" tokenSeparators={[',']} suffixIcon={null} />
  //     </Form.Item>
  //     <Form.Item name="credentials_json" label="Credentials">
  //       <AppTooltip title={isValidJson ? '' : 'Invalid JSON'}>
  //         <div
  //           className="h-[180px] w-full"
  //           style={{
  //             border: isValidJson ? `1px solid ${token.colorBorder}` : '1px solid red',
  //             borderRadius: '4px',
  //             overflow: 'hidden'
  //           }}>
  //           <AppCodeEditor language="json" value={creds} onChange={setCreds} />
  //         </div>
  //       </AppTooltip>
  //     </Form.Item>
  //   </FormWrapper>
  // );
};
