import {
  BusterDashboard,
  BusterDashboardResponse,
  VerificationStatus
} from '@/api/asset_interfaces';
import { ShareRole } from '@/api/asset_interfaces';
import { createMockMetric } from '../Metrics/MOCK_METRIC';

const mockMetric1 = createMockMetric('123456');
const mockMetric2 = createMockMetric('123');

const MOCK_DASHBOARD: BusterDashboard = {
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
    rows: [
      {
        id: 'my-row',
        columnSizes: [12],
        items: [{ id: mockMetric2.id }]
      }
    ]
  },
  sharingKey: 'mock-sharing-key',
  publicly_accessible: false,
  public_password: null,
  public_expiry_date: null,
  public_enabled_by: null,
  password_secret_id: null
};

export const MOCK_DASHBOARD_RESPONSE: BusterDashboardResponse = {
  access: ShareRole.EDITOR,
  metrics: [mockMetric2],
  dashboard: MOCK_DASHBOARD,
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
