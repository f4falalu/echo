import type { AssetType } from '@buster/server-shared/assets';
import {
  createFileRoute,
  Outlet,
  type RouteContext,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { getTitle as getAssetTitle } from '@/api/buster_rest/title';
import { getAssetIdAndVersionNumber } from '@/context/BusterAssets/getAssetIdAndVersionNumberServer';
import { useGetAssetPasswordConfig } from '@/context/BusterAssets/useGetAssetPasswordConfig';
import { AppAssetCheckLayout, type AppAssetCheckLayoutProps } from '@/layouts/AppAssetCheckLayout';

export const Route = createFileRoute('/app/_app/_asset')({
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ search }),
  context: () => ({ getAssetTitle }),
  beforeLoad: async ({ matches }) => {
    const assetType = [...matches].reverse().find(({ staticData }) => staticData?.assetType)
      ?.staticData?.assetType as AssetType;
    return {
      assetType,
    };
  },
});

const stableCtxSelector = (ctx: RouteContext) => ctx.assetType;
function RouteComponent() {
  const assetType = Route.useRouteContext({ select: stableCtxSelector }) || 'metric';
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false });
  const { assetId, versionNumber } = getAssetIdAndVersionNumber(assetType, params, search);
  const passwordConfig = useGetAssetPasswordConfig(assetId, assetType, versionNumber);

  const containerParams: AppAssetCheckLayoutProps = {
    assetId,
    type: assetType,
    versionNumber,
    ...passwordConfig,
  };

  return (
    <AppAssetCheckLayout {...containerParams}>
      <Outlet />
    </AppAssetCheckLayout>
  );
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    assetType?: AssetType;
  }

  interface RouteContext {
    assetType?: AssetType;
  }
}
