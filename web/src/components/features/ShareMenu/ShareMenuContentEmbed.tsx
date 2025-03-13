import { ShareAssetType } from '@/api/asset_interfaces';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { Input } from '@/components/ui/inputs';
import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { Link, BracketsCurly } from '@/components/ui/icons';
import { Separator } from '@/components/ui/seperator';
import { useUpdateCollection } from '@/api/buster_rest/collections';
import { useUpdateMetric } from '@/api/buster_rest/metrics';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';

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
        <div className="w-full">
          <Input size="small" value={createIframe(embedURL)} />
          <Button prefix={<Link />} className="flex" onClick={onCopyLink} />
        </div>

        <div className="mt-3 flex justify-end">
          <Button prefix={<BracketsCurly />} onClick={onCopyLink}>
            Copy code snippet
          </Button>
        </div>
      </div>

      <Separator />
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
  const { mutateAsync: onShareDashboard } = useUpdateDashboard();
  const { mutateAsync: onShareMetric } = useUpdateMetric();
  const { mutateAsync: onShareCollection, isPending: isSharingCollection } = useUpdateCollection();
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
