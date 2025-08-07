import type {
  BusterCollection,
  BusterDashboardResponse,
  BusterMetric
} from '@/api/asset_interfaces';
import type { ShareConfig } from '@buster/server-shared/share';
import type { ReportIndividualResponse } from '@buster/server-shared/reports';

export const getShareAssetConfig = (
  message:
    | BusterMetric
    | BusterDashboardResponse
    | BusterCollection
    | ReportIndividualResponse
    | null
): ShareConfig | null => {
  if (!message) return null;

  const {
    permission,
    individual_permissions,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password,
    workspace_sharing,
    workspace_member_count
  } = message;

  return {
    permission,
    individual_permissions,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password,
    workspace_sharing,
    workspace_member_count
  };
};
