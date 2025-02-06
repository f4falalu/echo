import {
  BusterDashboard,
  BusterDashboardResponse,
  VerificationStatus
} from '@/api/asset_interfaces';
import { ShareRole } from '@/api/asset_interfaces';
import {
  mockMetric1,
  mockMetric2,
  mockMetric3,
  mockMetric4,
  mockMetric5,
  mockMetric6,
  mockMetric7,
  mockMetric8,
  mockMetric9,
  mockMetric10,
  mockMetric11,
  mockMetric12,
  mockMetric13,
  mockMetric14,
  mockMetric15,
  mockMetric16,
  mockMetric17,
  mockMetric18,
  mockMetric19,
  mockMetric20,
  mockMetric21,
  mockMetric22,
  mockMetric23,
  mockMetric24,
  mockMetric25,
  mockMetric26,
  mockMetric27,
  mockMetric28,
  mockMetric29,
  mockMetric30
} from '../Metrics/MOCK_METRIC';

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
        id: 'row-1',
        columnSizes: [3, 3, 3, 3],
        items: [
          { id: mockMetric1.id },
          { id: mockMetric2.id },
          { id: mockMetric3.id },
          { id: mockMetric4.id }
        ]
      },
      {
        id: 'row-2',
        columnSizes: [4, 4, 4],
        items: [{ id: mockMetric5.id }, { id: mockMetric6.id }, { id: mockMetric7.id }]
      },
      {
        id: 'row-3',
        columnSizes: [6, 6],
        items: [{ id: mockMetric8.id }, { id: mockMetric9.id }]
      },
      {
        id: 'row-4',
        columnSizes: [3, 3, 6],
        items: [{ id: mockMetric10.id }, { id: mockMetric11.id }, { id: mockMetric12.id }]
      },
      {
        id: 'row-5',
        columnSizes: [6, 3, 3],
        items: [{ id: mockMetric13.id }, { id: mockMetric14.id }, { id: mockMetric15.id }]
      },
      {
        id: 'row-6',
        columnSizes: [4, 4, 4],
        items: [{ id: mockMetric16.id }, { id: mockMetric17.id }, { id: mockMetric18.id }]
      },
      {
        id: 'row-6-5',
        columnSizes: [12],
        items: [{ id: mockMetric19.id }]
      },
      {
        id: 'row-7',
        columnSizes: [3, 3, 6],
        items: [{ id: mockMetric20.id }, { id: mockMetric21.id }, { id: mockMetric22.id }]
      },
      {
        id: 'row-8',
        columnSizes: [6, 3, 3],
        items: [{ id: mockMetric23.id }, { id: mockMetric24.id }, { id: mockMetric25.id }]
      },
      {
        id: 'row-9',
        columnSizes: [4, 4, 4],
        items: [{ id: mockMetric26.id }, { id: mockMetric27.id }, { id: mockMetric28.id }]
      },
      {
        id: 'row-10',
        columnSizes: [6, 6],
        items: [{ id: mockMetric29.id }, { id: mockMetric30.id }]
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
  metrics: [
    mockMetric1,
    mockMetric2,
    mockMetric3,
    mockMetric4,
    mockMetric5,
    mockMetric6,
    mockMetric7,
    mockMetric8,
    mockMetric9,
    mockMetric10,
    mockMetric11,
    mockMetric12,
    mockMetric13,
    mockMetric14,
    mockMetric15,
    mockMetric16,
    mockMetric17,
    mockMetric18,
    mockMetric19,
    mockMetric20,
    mockMetric21,
    mockMetric22,
    mockMetric23,
    mockMetric24,
    mockMetric25,
    mockMetric26,
    mockMetric27,
    mockMetric28,
    mockMetric29,
    mockMetric30
  ],
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
