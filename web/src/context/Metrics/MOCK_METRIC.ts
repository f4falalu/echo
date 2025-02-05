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
  file_name: 'mock_metric.yml',
  description: faker.lorem.sentence(33),
  data_source_id: '6840fa04-c0d7-4e0e-8d3d-ea9190d93874',
  time_frame: '1d',
  type: 'metric',
  chart_config: MOCK_CHART_CONFIG,
  fetched: true,
  fetching: false,
  fetchedAt: 0,
  dataset_id: '21c91803-c324-4341-98d1-960ef6a3e003',
  dataset_name: 'Mock Dataset',
  error: null,
  data_metadata: dataMetadata,
  status: VerificationStatus.notRequested,
  evaluation_score: 'Moderate',
  evaluation_summary: faker.lorem.sentence(33),
  file: `
metric:
  name: sales_performance
  description: Monthly sales performance by product
  source: sales_database
  refresh_interval: daily
  
dimensions:
  - name: date
    type: date
    format: YYYY-MM-DD
  - name: product
    type: string
  - name: region 
    type: string
    
measures:
  - name: sales_amount
    type: decimal
    aggregation: sum
  - name: units_sold
    type: integer
    aggregation: sum
    
filters:
  - field: date
    operator: between
    value: [2024-01-01, 2024-12-31]
  - field: region
    operator: in
    value: [North, South, East, West]
    
joins:
  - name: product_details
    type: left
    on: product_id
    
sorting:
  - field: sales_amount
    direction: desc
    
limit: 1000`,
  created_at: '',
  updated_at: '',
  sent_by_id: '',
  sent_by_name: '',
  sent_by_avatar_url: '',
  code: `WITH records AS (
  SELECT 
    response_time_id,
    interaction_id,
    agent_id,
    customer_id,
    channel,
    date
  FROM demo.response_times
  ORDER BY date ASC
  LIMIT 100
)
SELECT * FROM records;`,
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

export const createMockMetric = (id: string): IBusterMetric => {
  return {
    ...MOCK_METRIC,
    id
  };
};
