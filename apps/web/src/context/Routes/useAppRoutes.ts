import type { AssetType } from '@buster/server-shared/assets';
import { useMatches } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useGetParentRoute = () => {
  const afterAppSplash = useMatches({
    select: (matches) => {
      const secondToLastMatch = matches[matches.length - 2];
      return secondToLastMatch.routeId;
    },
  });

  return afterAppSplash;
};

export const useGetSelectedAssetTypeLoose = () => {
  const assetType = useMatches({
    select: useMemoizedFn((matches) => {
      return [...matches].reverse().find(({ staticData }) => staticData?.assetType)?.staticData
        ?.assetType;
    }),
  });

  return useMemo(() => assetType as unknown as AssetType, [assetType]);
};
