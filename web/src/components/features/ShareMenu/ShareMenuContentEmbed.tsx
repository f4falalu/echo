import { ShareAssetType } from '@/api/asset_interfaces';
import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { Divider, Space } from 'antd';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { Input } from '@/components/ui/inputs';
import React, { useMemo } from 'react';
import { useMemoizedFn } from 'ahooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { Link, BracketsCurly } from '@/components/ui/icons';

export const ShareMenuContentEmbed: React.FC<{
  assetType: ShareAssetType;
  assetId: string;
}> = React.memo(({ assetType, assetId }) => {
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

  return (
    <div className="flex flex-col">
      <div className="w-full p-3">
        <Space.Compact className="w-full">
          <Input className="h-[24px]!" value={createIframe(embedURL)} />
          <Button prefix={<Link />} className="flex" onClick={onCopyLink} />
        </Space.Compact>

        <div className="mt-3 flex justify-end">
          <Button prefix={<BracketsCurly />} onClick={onCopyLink}>
            Copy code snippet
          </Button>
        </div>
      </div>

      <Divider />
    </div>
  );
});
ShareMenuContentEmbed.displayName = 'ShareMenuContentEmbed';

const createIframe = (url: string) => {
  const newUrl = window.location.origin + url;

  return `<iframe src="${newUrl}" width="100%" height="100%" frameborder="0"></iframe>`;
};

export const ShareMenuContentEmbedFooter = ({
  assetId,
  assetType
}: {
  assetId: string;
  assetType: ShareAssetType;
}) => {
  const onShareDashboard = useBusterDashboardContextSelector((state) => state.onShareDashboard);
  const onShareMetric = useBusterMetricsIndividualContextSelector((state) => state.onShareMetric);
  const onShareCollection = useBusterCollectionIndividualContextSelector(
    (state) => state.onShareCollection
  );
  const { openSuccessMessage } = useBusterNotifications();

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
    <div className="bg-item-hover flex justify-start overflow-hidden rounded-b p-2 px-2.5">
      <Text variant="secondary" className="text-xs!">
        {`Your dashboard currently isn’t published.`}

        <span
          onClick={() => {
            onPublish();
          }}
          className="text-primary ml-1 cursor-pointer">
          Publish
        </span>
      </Text>
    </div>
  );
};
