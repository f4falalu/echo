'use server';

import React from 'react';
import { ShareAssetType } from '@/api/asset_interfaces';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { prefetchAssetCheck } from '@/api/buster_rest/assets';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export type AppAssetCheckLayoutProps = {
  assetId: string;
  type: 'metric' | 'dashboard';
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = async ({ children, type, assetId }) => {
  const { queryClient, res } = await prefetchAssetCheck({ assetId: assetId, fileType: type });

  const { has_access, password_required, public: pagePublic } = res;

  const Component = (() => {
    if (!has_access && !pagePublic) {
      return <AppNoPageAccess assetId={assetId} />;
    }

    if (pagePublic && password_required) {
      return (
        <AppPasswordAccess assetId={assetId} type={type as ShareAssetType}>
          {children}
        </AppPasswordAccess>
      );
    }

    return <>{children}</>;
  })();

  const dehydratedState = dehydrate(queryClient);

  return <HydrationBoundary state={dehydratedState}>{Component}</HydrationBoundary>;
};
