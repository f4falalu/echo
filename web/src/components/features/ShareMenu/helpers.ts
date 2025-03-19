import {
  BusterCollection,
  BusterDashboardResponse,
  BusterShare,
  IBusterChatMessage,
  IBusterMetric,
  ShareRole
} from '@/api/asset_interfaces';

export const isShareMenuVisible = (shareAssetConfig: BusterShare | null) => {
  return (
    !!shareAssetConfig &&
    (shareAssetConfig.permission === ShareRole.OWNER ||
      shareAssetConfig.permission === ShareRole.EDITOR)
  );
};

export const getShareAssetConfig = (
  message: IBusterMetric | BusterDashboardResponse | BusterCollection | null
): BusterShare | null => {
  if (!message) return null;

  const {
    sharingKey,
    permission,
    individual_permissions,
    team_permissions,
    organization_permissions,
    password_secret_id,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password
  } = message;

  return {
    sharingKey,
    permission,
    individual_permissions,
    team_permissions,
    organization_permissions,
    password_secret_id,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password
  };
};
