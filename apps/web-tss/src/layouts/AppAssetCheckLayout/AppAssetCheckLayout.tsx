'use client';

import type { ShareAssetType } from '@buster/server-shared/share';
import type React from 'react';
import { useMemo } from 'react';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { type UseGetAssetProps, useGetAsset } from './useGetAsset';

export type AppAssetCheckLayoutProps = UseGetAssetProps;

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = ({ children, ...props }) => {
  const { hasAccess, passwordRequired, isPublic, isFetched, showLoader } = useGetAsset(props);
  const { assetId, type } = props;

  const Component = useMemo(() => {
    if (!isFetched) return null;

    if (!hasAccess && !isPublic) {
      return <AppNoPageAccess />;
    }

    if (isPublic && passwordRequired) {
      return (
        <AppPasswordAccess assetId={assetId} type={type as ShareAssetType}>
          {children}
        </AppPasswordAccess>
      );
    }

    return <>{children}</>;
  }, [isFetched, hasAccess, isPublic, passwordRequired, assetId, type, children]);

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {Component}
    </>
  );
};

AppAssetCheckLayout.displayName = 'AppAssetCheckLayout';
