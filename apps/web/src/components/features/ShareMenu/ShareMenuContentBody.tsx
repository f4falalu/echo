import React from 'react';
import type { ShareAssetType, ShareConfig, ShareRole, WorkspaceShareRole } from '@buster/server-shared/share';
import { useUnshareCollection, useUpdateCollectionShare } from '@/api/buster_rest/collections';
import { useUnshareDashboard, useUpdateDashboardShare } from '@/api/buster_rest/dashboards';
import { useUnshareMetric, useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { IndividualSharePerson } from './IndividualSharePerson';
import { ShareMenuContentEmbed } from './ShareMenuContentEmbed';
import { ShareMenuContentPublish } from './ShareMenuContentPublish';
import type { ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { ShareMenuInvite } from './ShareMenuInvite';
import { WorkspaceShareSection } from './WorkspaceShareSection';

export const ShareMenuContentBody: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  onCopyLink: () => void;
  shareAssetConfig: ShareConfig;
  assetId: string;
  assetType: ShareAssetType;
  canEditPermissions: boolean;
  className?: string;
}> = React.memo(
  ({
    onCopyLink,
    shareAssetConfig,
    selectedOptions,
    assetId,
    canEditPermissions,
    assetType,
    className = ''
  }) => {
    const Component = ContentRecord[selectedOptions];
    const individual_permissions = shareAssetConfig.individual_permissions;
    const publicly_accessible = shareAssetConfig.publicly_accessible;
    const publicExpirationDate = shareAssetConfig.public_expiry_date;
    const password = shareAssetConfig.public_password;

    return (
      <Component
        onCopyLink={onCopyLink}
        individual_permissions={individual_permissions}
        publicly_accessible={publicly_accessible}
        publicExpirationDate={publicExpirationDate}
        password={password}
        assetId={assetId}
        assetType={assetType}
        canEditPermissions={canEditPermissions}
        className={className}
        shareAssetConfig={shareAssetConfig}
      />
    );
  }
);
ShareMenuContentBody.displayName = 'ShareMenuContentBody';

const ShareMenuContentShare: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({ canEditPermissions, assetType, individual_permissions, assetId, className, shareAssetConfig }) => {
    const { mutateAsync: onUpdateMetricShare } = useUpdateMetricShare();
    const { mutateAsync: onUpdateDashboardShare } = useUpdateDashboardShare();
    const { mutateAsync: onUpdateCollectionShare } = useUpdateCollectionShare();
    const { mutateAsync: onUnshareMetric } = useUnshareMetric();
    const { mutateAsync: onUnshareDashboard } = useUnshareDashboard();
    const { mutateAsync: onUnshareCollection } = useUnshareCollection();

    const hasIndividualPermissions = !!individual_permissions?.length;

    const onUpdateShareRole = useMemoizedFn(async (email: string, role: ShareRole | null) => {
      if (role) {
        const payload: Parameters<typeof onUpdateMetricShare>[0] = {
          id: assetId,
          params: {
            users: [
              {
                email,
                role
              }
            ]
          }
        };
        if (assetType === 'metric') {
          await onUpdateMetricShare(payload);
        } else if (assetType === 'dashboard') {
          await onUpdateDashboardShare(payload);
        } else if (assetType === 'collection') {
          await onUpdateCollectionShare(payload);
        }
      } else {
        const payload: Parameters<typeof onUnshareMetric>[0] = {
          id: assetId,
          data: [email]
        };
        if (assetType === 'metric') {
          await onUnshareMetric(payload);
        } else if (assetType === 'dashboard') {
          await onUnshareDashboard(payload);
        } else if (assetType === 'collection') {
          await onUnshareCollection(payload);
        }
      }
    });

    const onUpdateWorkspacePermissions = useMemoizedFn(async (role: WorkspaceShareRole | null) => {
      const payload: Parameters<typeof onUpdateMetricShare>[0] = {
        id: assetId,
        params: {
          workspace_permissions: role
        }
      };
      
      if (assetType === 'metric') {
        await onUpdateMetricShare(payload);
      } else if (assetType === 'dashboard') {
        await onUpdateDashboardShare(payload);
      } else if (assetType === 'collection') {
        await onUpdateCollectionShare(payload);
      }
    });

    return (
      <div className={cn('flex flex-col space-y-2.5', className)}>
        {canEditPermissions && (
          <ShareMenuInvite
            assetType={assetType}
            assetId={assetId}
            individualPermissions={individual_permissions}
          />
        )}

        {canEditPermissions && (
          <WorkspaceShareSection
            shareAssetConfig={shareAssetConfig}
            assetType={assetType}
            assetId={assetId}
            canEditPermissions={canEditPermissions}
            onUpdateWorkspacePermissions={onUpdateWorkspacePermissions}
          />
        )}

        {hasIndividualPermissions && (
          <div className="flex flex-col space-y-2 overflow-hidden">
            {individual_permissions?.map((permission) => (
              <IndividualSharePerson
                key={permission.email}
                {...permission}
                onUpdateShareRole={onUpdateShareRole}
                assetType={assetType}
                disabled={!canEditPermissions || permission.role === 'owner'}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
ShareMenuContentShare.displayName = 'ShareMenuContentShare';

export interface ShareMenuContentBodyProps {
  onCopyLink: () => void;
  individual_permissions: ShareConfig['individual_permissions'];
  publicly_accessible: boolean;
  publicExpirationDate: string | null | undefined;
  password: string | null | undefined;
  assetId: string;
  assetType: ShareAssetType;
  canEditPermissions: boolean;
  className: string;
  shareAssetConfig: ShareConfig;
}

const ContentRecord: Record<ShareMenuTopBarOptions, React.FC<ShareMenuContentBodyProps>> = {
  Share: ShareMenuContentShare,
  Embed: ShareMenuContentEmbed,
  Publish: ShareMenuContentPublish
};
