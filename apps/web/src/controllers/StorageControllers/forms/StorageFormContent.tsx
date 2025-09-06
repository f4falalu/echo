import type { StorageProvider } from '@buster/server-shared/s3-integrations';
import type React from 'react';
import { GCSForm } from './GCSForm';
import { R2Form } from './R2Form';
import { S3Form } from './S3Form';

interface StorageFormContentProps {
  type: StorageProvider;
}

export const StorageFormContent: React.FC<StorageFormContentProps> = ({ type }) => {
  if (type === 's3') {
    return <S3Form />;
  } else if (type === 'r2') {
    return <R2Form />;
  } else if (type === 'gcs') {
    return <GCSForm />;
  }

  const _exhaustiveCheck: never = type;
  return null;
};
