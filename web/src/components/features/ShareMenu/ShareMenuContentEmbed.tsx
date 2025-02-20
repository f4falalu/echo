import { ShareAssetType } from '@/api/asset_interfaces';
import { AppMaterialIcons } from '@/components/ui';
import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useAntToken } from '@/styles/useAntToken';
import { Button, Divider, Input, Space } from 'antd';
import React, { useMemo } from 'react';
import { Text } from '@/components/ui';
import { useMemoizedFn } from 'ahooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';

export const ShareMenuContentEmbed: React.FC<{
  publicExpirationDate: string;
  publicly_accessible: boolean;
  password: string | null;
  assetType: ShareAssetType;
  assetId: string;
}> = React.memo(({ publicExpirationDate, publicly_accessible, password, assetType, assetId }) => {
  const token = useAntToken();
  const onShareDashboard = useBusterDashboardContextSelector((state) => state.onShareDashboard);
  const onShareMetric = useBusterMetricsIndividualContextSelector((state) => state.onShareMetric);
  const onShareCollection = useBusterCollectionIndividualContextSelector(
    (state) => state.onShareCollection
  );
  const { openSuccessMessage } = useBusterNotifications();

  const embedURL = useMemo(() => {
    let url = '';

    if (assetType === ShareAssetType.METRIC) {
      url = createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID,
        metricId: assetId
      });
    }

    if (assetType === ShareAssetType.DASHBOARD) {
      url = createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: assetId
      });
    }

    if (assetType === ShareAssetType.COLLECTION) {
      url = createBusterRoute({
        route: BusterRoutes.APP_COLLECTIONS_ID,
        collectionId: assetId
      });
    }

    return url + '?embed=true';
  }, [assetType, assetId]);

  const onCopyLink = useMemoizedFn(() => {
    const url = window.location.origin + embedURL;
    navigator.clipboard.writeText(url);
    openSuccessMessage('Link copied to clipboard');
  });

  const onPublish = useMemoizedFn(async () => {
    const payload = {
      id: assetId,
      publicly_accessible: true
    };

    if (assetType === ShareAssetType.METRIC) {
      await onShareMetric(payload);
    } else if (assetType === ShareAssetType.DASHBOARD) {
      await onShareDashboard(payload);
    } else if (assetType === ShareAssetType.COLLECTION) {
      await onShareCollection(payload);
    }
    openSuccessMessage('Succuessfully published');
  });

  return (
    <div className="flex flex-col">
      <div className="w-full p-3">
        <Space.Compact className="w-full">
          <Input className="h-[24px]!" value={createIframe(embedURL)} />
          <Button className="flex" type="default" onClick={onCopyLink}>
            <AppMaterialIcons icon="link" />
          </Button>
        </Space.Compact>

        <div className="flex justify-end">
          <Button
            icon={<AppMaterialIcons icon="data_object" />}
            type="default"
            className="mt-3"
            onClick={onCopyLink}>
            Copy code snippet
          </Button>
        </div>
      </div>

      <Divider />

      {!publicly_accessible && (
        <div
          className="flex justify-start overflow-hidden p-2 px-2.5"
          style={{
            background: token.controlItemBgHover,
            borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px `
          }}>
          <Text type="secondary" className="text-xs!">
            {`Your dashboard currently isn’t published.`}

            <span
              onClick={() => {
                onPublish();
              }}
              className="ml-1 cursor-pointer"
              style={{
                color: token.colorPrimary
              }}>
              Publish
            </span>
          </Text>
        </div>
      )}
    </div>
  );
});
ShareMenuContentEmbed.displayName = 'ShareMenuContentEmbed';

const createIframe = (url: string) => {
  const newUrl = window.location.origin + url;

  return `<iframe src="${newUrl}" width="100%" height="100%" frameborder="0"></iframe>`;
};
