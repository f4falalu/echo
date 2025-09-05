import type { StorageProvider } from '@buster/server-shared/s3-integrations';
import { Link, useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import AWSS3Icon from '@/components/ui/icons/customIcons/aws-s3';
import CloudflareR2Icon from '@/components/ui/icons/customIcons/cloudflare-r2';
import GoogleCloudStorageIcon from '@/components/ui/icons/customIcons/google-cloud-storage';
import { Text, Title } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { HeaderContainer } from '../DataSourcesAddController/HeaderContainer';
import { StorageFormContent } from './forms/StorageFormContent';

export function StorageAddController({ type }: { type: StorageProvider | undefined }) {
  const navigate = useNavigate();
  const [selectedStorage, setSelectedStorage] = useState<StorageProvider | null>(
    getValidType(type)
  );

  //   const linkUrl = selectedStorage
  //     ? createBusterRoute({
  //         route: BusterRoutes.SETTINGS_STORAGE_ADD,
  //       })
  //     : createBusterRoute({
  //         route: BusterRoutes.SETTINGS_INTEGRATIONS,
  //       });

  const onClearSelectedStorage = useMemoizedFn(() => {
    setSelectedStorage(null);
    // onChangePage({ route: BusterRoutes.SETTINGS_STORAGE_ADD });
    navigate({ to: '/app/settings/storage/add' });
  });

  useEffect(() => {
    if (getValidType(type)) {
      setSelectedStorage(getValidType(type));
    }
  }, [type]);

  return (
    <div className="flex flex-col space-y-5">
      <HeaderContainer
        buttonText={selectedStorage ? 'Connect a storage' : 'Integrations'}
        onClick={onClearSelectedStorage}
        linkUrl={
          selectedStorage
            ? { to: '/app/settings/storage/add' }
            : { to: '/app/settings/integrations' }
        }
      />

      {selectedStorage ? (
        <StorageFormContent type={selectedStorage} />
      ) : (
        <div className="flex flex-col space-y-6">
          <ConnectHeader />
          <StorageList />
        </div>
      )}
    </div>
  );
}

const ConnectHeader: React.FC = () => {
  return (
    <div className="flex flex-col space-y-1">
      <Title as="h3">{'Connect a storage provider'}</Title>
      <Text variant="secondary">{"Select the storage provider you'd like to connect"}</Text>
    </div>
  );
};

const StorageList: React.FC = () => {
  const storageProviders: Array<{
    type: StorageProvider;
    name: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'r2',
      name: 'Cloudflare R2',
      icon: <CloudflareR2Icon className="h-7 w-7" />,
    },
    {
      type: 's3',
      name: 'AWS S3',
      icon: <AWSS3Icon className="h-7 w-7" />,
    },
    {
      type: 'gcs',
      name: 'Google Cloud Storage',
      icon: <GoogleCloudStorageIcon className="h-7 w-7" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {storageProviders.map((provider) => {
        return (
          <Link
            to={`/app/settings/storage/add`}
            search={{
              type: provider.type,
            }}
            key={provider.type}
            className={cn(
              'flex cursor-pointer items-center space-x-4 px-4 py-3 shadow transition',
              'bg-background hover:bg-item-hover',
              'border-border max-h-[48px] rounded border'
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center">{provider.icon}</div>
            <Text>{provider.name}</Text>
          </Link>
        );
      })}
    </div>
  );
};

const getValidType = (type: string | undefined): StorageProvider | null => {
  const validTypes: StorageProvider[] = ['s3', 'r2', 'gcs'];
  return validTypes.includes(type as StorageProvider) ? (type as StorageProvider) : null;
};
