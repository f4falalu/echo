import type { ShareAssetType } from '@buster/server-shared/share';
import { Store, useStore } from '@tanstack/react-store';
import { useCallback } from 'react';

type ProtectedAsset = {
  password: string | undefined;
  type: ShareAssetType | undefined;
  error: string | null;
};

const protectedAssetsStore = new Store(new Map<string, ProtectedAsset>());

export const getProtectedAssetFromStore = (assetId: string) => {
  return protectedAssetsStore.state.get(assetId);
};

export const getProtectedAssetPassword = (assetId: string) => {
  return getProtectedAssetFromStore(assetId)?.password;
};

export const setProtectedAssetPassword = ({
  assetId,
  password,
  type,
}: {
  assetId: string;
  password: string;
  type: ShareAssetType;
}) => {
  protectedAssetsStore.setState((prev) =>
    new Map(prev).set(assetId, { password, type, error: null })
  );
};

export const setProtectedAssetPasswordError = ({
  assetId,
  error,
}: {
  assetId: string;
  error: string | null;
}) => {
  const asset = getProtectedAssetFromStore(assetId);

  if (!asset) {
    return;
  }

  protectedAssetsStore.setState((prev) => new Map(prev).set(assetId, { ...asset, error }));
};

export const useProtectedAsset = (assetId: string): ProtectedAsset => {
  const asset = useStore(
    protectedAssetsStore,
    useCallback((state: typeof protectedAssetsStore.state) => state.get(assetId), [assetId])
  );

  return asset || { password: undefined, type: undefined, error: null };
};

export const useProtectedAssetPassword = (assetId: string) => {
  const asset = useStore(
    protectedAssetsStore,
    useCallback(
      (state: typeof protectedAssetsStore.state) => state.get(assetId)?.password,
      [assetId]
    )
  );

  return asset;
};
