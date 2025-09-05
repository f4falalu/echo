import type { ShareAssetType } from '@buster/server-shared/share';
import type { BuildLocationFn, ParsedLocation } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { useUpdateCollectionShare } from '@/api/buster_rest/collections';
import { useUpdateDashboardShare } from '@/api/buster_rest/dashboards';
import { useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { Button } from '@/components/ui/buttons';
import { Link } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/classMerge';
import { createFullURL } from '@/lib/routes';
import { useBuildLocation } from '../../../context/Routes/useRouteBuilder';
import type { ShareMenuContentBodyProps } from './ShareMenuContentBody';

export const ShareMenuContentEmbed: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({ className, assetType, assetId }) => {
    const buildLocation = useBuildLocation();
    const { openSuccessMessage } = useBusterNotifications();

    const embedURL = useMemo(() => {
      if (assetType === 'metric') {
        return createFullURL(
          buildLocation({
            to: '/embed/metric/$metricId',
            params: {
              metricId: assetId,
            },
          })
        );
      }

      if (assetType === 'dashboard') {
        return createFullURL(
          buildLocation({
            to: '/embed/dashboard/$dashboardId',
            params: {
              dashboardId: assetId,
            },
          })
        );
      }

      if (assetType === 'report') {
        return createFullURL(
          buildLocation({
            to: '/embed/report/$reportId',
            params: {
              reportId: assetId,
            },
          })
        );
      }

      if (assetType === 'chat') {
        return '';
      }

      if (assetType === 'collection') {
        return '';
      }

      const _exhaustiveCheck: never = assetType;

      return '';
    }, [assetType, assetId, buildLocation]);

    const onCopyLink = () => {
      const url = window.location.origin + embedURL;
      navigator.clipboard.writeText(url);
      openSuccessMessage('Link copied to clipboard');
    };

    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex w-full items-center space-x-1">
          <Input size="small" defaultValue={createIframe(embedURL)} readOnly />
          <Button prefix={<Link />} className="flex" onClick={onCopyLink} />
        </div>
      </div>
    );
  }
);
ShareMenuContentEmbed.displayName = 'ShareMenuContentEmbed';

const createIframe = (url: string) => {
  return `<iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>`;
};

export const ShareMenuContentEmbedFooter = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: ShareAssetType;
}) => {
  const { mutateAsync: onShareDashboard } = useUpdateDashboardShare();
  const { mutateAsync: onShareMetric } = useUpdateMetricShare();
  const { mutateAsync: onShareCollection } = useUpdateCollectionShare();
  const { openSuccessMessage } = useBusterNotifications();

  const onPublish = async () => {
    const payload: Parameters<typeof onShareMetric>[0] = {
      id: assetId,
      params: {
        publicly_accessible: true,
      },
    };
    if (assetType === 'metric') {
      await onShareMetric(payload);
    } else if (assetType === 'dashboard') {
      await onShareDashboard(payload);
    } else if (assetType === 'collection') {
      await onShareCollection(payload);
    }
    openSuccessMessage('Succuessfully published');
  };

  return (
    <div className="bg-item-hover flex justify-start overflow-hidden rounded-b px-3 py-2.5">
      <Text variant="secondary" className="text-xs!">
        {'Your dashboard currently isn’t published.'}

        <button
          type="button"
          onClick={() => {
            onPublish();
          }}
          className="text-primary ml-1 cursor-pointer"
        >
          Publish
        </button>
      </Text>
    </div>
  );
};
