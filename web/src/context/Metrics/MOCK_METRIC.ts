import {
  DataMetadata,
  DEFAULT_CHART_CONFIG,
  IBusterMetricChartConfig,
  ShareRole,
  VerificationStatus
} from '@/api/asset_interfaces';
import { IBusterMetric } from './interfaces';
import { faker } from '@faker-js/faker';
import { ChartType } from '@/components/charts';

const MOCK_CHART_CONFIG: IBusterMetricChartConfig = {
  ...DEFAULT_CHART_CONFIG,
  selectedChartType: ChartType.Bar,
  barAndLineAxis: {
    x: ['date'],
    y: ['sales'],
    category: []
  },
  pieChartAxis: {
    x: ['product'],
    y: ['sales']
  },
  scatterAxis: {
    x: ['date'],
    y: ['sales']
  }
};

const dataMetadata: DataMetadata = {
  column_count: 3,
  column_metadata: [
    {
      name: 'sales',
      min_value: 0,
      max_value: 1000,
      unique_values: 10,
      simple_type: 'number',
      type: 'integer'
    },
    {
      name: 'date',
      min_value: '2024-01-01',
      max_value: '2024-01-31',
      unique_values: 31,
      simple_type: 'date',
      type: 'date'
    },
    {
      name: 'product',
      min_value: 'Product A',
      max_value: 'Product Z',
      unique_values: 26,
      simple_type: 'text',
      type: 'text'
    }
  ],
  row_count: 10
};

export const MOCK_METRIC: IBusterMetric = {
  id: '123',
  title: 'Mock Metric',
  version_number: 1,
  description: faker.lorem.sentence(33),
  time_frame: '1d',
  type: 'metric',
  chart_config: MOCK_CHART_CONFIG,
  fetched: true,
  fetching: false,
  fetchedAt: 0,
  dataset_id: '123',
  dataset_name: 'Mock Dataset',
  error: null,
  data_metadata: dataMetadata,
  status: VerificationStatus.notRequested,
  evaluation_score: 'Moderate',
  evaluation_summary: faker.lorem.sentence(33),
  file: '',
  created_at: '',
  updated_at: '',
  sent_by_id: '',
  sent_by_name: '',
  sent_by_avatar_url: '',
  code: null,
  feedback: null,
  draft_session_id: null,
  collections: [],
  dashboards: [],
  sharingKey: '',
  individual_permissions: [],
  team_permissions: [],
  organization_permissions: [],
  password_secret_id: '',
  public_expiry_date: '',
  public_enabled_by: '',
  publicly_accessible: false,
  public_password: '',
  permission: ShareRole.OWNER
};
