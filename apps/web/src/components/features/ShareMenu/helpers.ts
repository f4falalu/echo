import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import type { GetMetricResponse } from '@buster/server-shared/metrics';
import type { GetReportResponse } from '@buster/server-shared/reports';
import type { ShareConfig } from '@buster/server-shared/share';
import type { BusterCollection } from '@/api/asset_interfaces/collection';

export const getShareAssetConfig = (
  message: GetMetricResponse | GetDashboardResponse | BusterCollection | GetReportResponse | null
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
    workspace_member_count,
  } = message;

  return {
    permission,
    individual_permissions,
    public_expiry_date,
    public_enabled_by,
    publicly_accessible,
    public_password,
    workspace_sharing,
    workspace_member_count,
  };
};
