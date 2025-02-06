import {
  BusterDashboard,
  BusterDashboardResponse,
  VerificationStatus
} from '@/api/asset_interfaces';
import { ShareRole } from '@/api/asset_interfaces';
import { createMockMetric } from '../Metrics/MOCK_METRIC';

interface DashboardMockResponse {
  dashboard: BusterDashboard;
  response: BusterDashboardResponse;
}

const createMockDashboardRow = (startIndex: number, metrics: string[], columnSizes: number[]) => ({
  id: `row-${startIndex}`,
  columnSizes,
  items: metrics.map((metricId) => ({ id: metricId }))
});

export const generateMockDashboard = (numMetrics: number): DashboardMockResponse => {
  // Generate the specified number of metrics
  const metrics = Array.from({ length: numMetrics }, (_, i) => createMockMetric(`number${i + 1}`));
  const metricIds = metrics.map((metric) => metric.id);

  // Create rows based on number of metrics
  const rows = [];
  let currentIndex = 0;

  while (currentIndex < metricIds.length) {
    const remainingMetrics = metricIds.length - currentIndex;

    if (remainingMetrics >= 4) {
      // Add a row with 4 equal columns
      rows.push(
        createMockDashboardRow(
          rows.length + 1,
          metricIds.slice(currentIndex, currentIndex + 4),
          [3, 3, 3, 3]
        )
      );
      currentIndex += 4;
    } else if (remainingMetrics >= 3) {
      // Add a row with 3 equal columns
      rows.push(
        createMockDashboardRow(
          rows.length + 1,
          metricIds.slice(currentIndex, currentIndex + 3),
          [4, 4, 4]
        )
      );
      currentIndex += 3;
    } else if (remainingMetrics >= 2) {
      // Add a row with 2 equal columns
      rows.push(
        createMockDashboardRow(
          rows.length + 1,
          metricIds.slice(currentIndex, currentIndex + 2),
          [6, 6]
        )
      );
      currentIndex += 2;
    } else {
      // Add a row with 1 column
      rows.push(
        createMockDashboardRow(rows.length + 1, metricIds.slice(currentIndex, currentIndex + 1), [
          12
        ])
      );
      currentIndex += 1;
    }
  }

  const dashboard: BusterDashboard = {
    id: '123',
    name: 'Mock Dashboard',
    description: null,
    created_at: new Date().toISOString(),
    created_by: 'user-123',
    updated_at: null,
    updated_by: 'user-123',
    deleted_at: null,
    status: VerificationStatus.notRequested,
    config: {
      rows
    },
    sharingKey: 'mock-sharing-key',
    publicly_accessible: false,
    public_password: null,
    public_expiry_date: null,
    public_enabled_by: null,
    password_secret_id: null
  };

  const response: BusterDashboardResponse = {
    access: ShareRole.EDITOR,
    metrics,
    dashboard,
    permission: ShareRole.EDITOR,
    public_password: null,
    sharingKey: 'mock-sharing-key',
    individual_permissions: null,
    team_permissions: null,
    organization_permissions: null,
    password_secret_id: null,
    public_expiry_date: null,
    public_enabled_by: null,
    publicly_accessible: false
  };

  return { dashboard, response };
};

// Example usage:
// const { dashboard, response } = generateMockDashboard(12);

export const MOCK_DASHBOARD_RESPONSE = generateMockDashboard(15).response;
