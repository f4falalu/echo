import type { AssetType } from '@buster/server-shared/assets';
import type { ShareAssetType } from '@buster/server-shared/share';
import type React from 'react';
import { useMemo } from 'react';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import { AppNoPageAccess } from '@/controllers/AppNoPageAccess';
import { AppPasswordAccess } from '@/controllers/AppPasswordAccess';
import { useShowLoader } from '../../context/BusterAssets/useShowLoader';

export type AppAssetCheckLayoutProps = {
  assetId: string;
  type: AssetType;
  versionNumber: undefined | number;
  passwordRequired: boolean;
  isPublic: boolean;
  hasAccess: boolean;
};

export const AppAssetCheckLayout: React.FC<
  {
    children: React.ReactNode;
  } & AppAssetCheckLayoutProps
> = ({ children, assetId, type, versionNumber, passwordRequired, isPublic, hasAccess }) => {
  const showLoader = useShowLoader(assetId, type, versionNumber);

  const Component = useMemo(() => {
    if (!hasAccess && !isPublic) {
      return <AppNoPageAccess assetId={assetId} type={type} />;
    }

    if (isPublic && passwordRequired) {
      return (
        <AppPasswordAccess assetId={assetId} type={type}>
          {children}
        </AppPasswordAccess>
      );
    }

    return <>{children}</>;
  }, [hasAccess, isPublic, passwordRequired, assetId, type, children]);

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {Component}
    </>
  );
};

AppAssetCheckLayout.displayName = 'AppAssetCheckLayout';
