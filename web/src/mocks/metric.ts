import {
  ChartType,
  type DataMetadata,
  DEFAULT_CHART_CONFIG,
  type IBusterMetricChartConfig,
  type IBusterMetric,
  BusterMetricListItem
} from '@/api/asset_interfaces/metric';
import { ShareRole, VerificationStatus } from '@/api/asset_interfaces/share';
import { faker } from '@faker-js/faker';

const createMockChartConfig = (): IBusterMetricChartConfig => {
  const chartType = faker.helpers.arrayElement([
    ChartType.Bar,
    ChartType.Table,
    ChartType.Line,
    ChartType.Pie,
    ChartType.Scatter,
    ChartType.Metric
  ]);

  return {
    ...DEFAULT_CHART_CONFIG,
    selectedChartType: chartType,
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
    },
    metricColumnId: 'sales',
    metricHeader: {
      columnId: 'sales',
      useValue: false
    }
  };
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

export const createMockMetric = (id: string): IBusterMetric => {
  const chart_config = createMockChartConfig();

  return {
    title: id + ' - ' + faker.lorem.words({ min: 2, max: 6 }),
    version_number: 1,
    file_name: `${faker.lorem.words({ min: 1, max: 4 })}.yml`,
    description: faker.commerce.productName(),
    data_source_id: '6840fa04-c0d7-4e0e-8d3d-ea9190d93874',
    time_frame: '1d',
    type: 'metric',
    chart_config: chart_config,
    dataset_id: '21c91803-c324-4341-98d1-960ef6a3e003',
    dataset_name: 'Mock Dataset',
    error: null,
    data_metadata: dataMetadata,
    status: VerificationStatus.NOT_REQUESTED,
    evaluation_score: 'Moderate',
    versions: [],
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
    sql: `WITH records AS (
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
    collections: [],
    dashboards: [],
    individual_permissions: [],
    public_expiry_date: '',
    public_enabled_by: '',
    publicly_accessible: false,
    public_password: '',
    permission: ShareRole.OWNER,
    id
  };
};

export const mockMetric1 = createMockMetric('number1');
export const mockMetric2 = createMockMetric('number2');
export const mockMetric3 = createMockMetric('number3');
export const mockMetric4 = createMockMetric('number4');
export const mockMetric5 = createMockMetric('number5');
export const mockMetric6 = createMockMetric('number6');
export const mockMetric7 = createMockMetric('number7');
export const mockMetric8 = createMockMetric('number8');
export const mockMetric9 = createMockMetric('number9');
export const mockMetric10 = createMockMetric('number10');
export const mockMetric11 = createMockMetric('number11');
export const mockMetric12 = createMockMetric('number12');
export const mockMetric13 = createMockMetric('number13');
export const mockMetric14 = createMockMetric('number14');
export const mockMetric15 = createMockMetric('number15');
export const mockMetric16 = createMockMetric('number16');
export const mockMetric17 = createMockMetric('number17');
export const mockMetric18 = createMockMetric('number18');
export const mockMetric19 = createMockMetric('number19');
export const mockMetric20 = createMockMetric('number20');
export const mockMetric21 = createMockMetric('number21');
export const mockMetric22 = createMockMetric('number22');
export const mockMetric23 = createMockMetric('number23');
export const mockMetric24 = createMockMetric('number24');
export const mockMetric25 = createMockMetric('number25');
export const mockMetric26 = createMockMetric('number26');
export const mockMetric27 = createMockMetric('number27');
export const mockMetric28 = createMockMetric('number28');
export const mockMetric29 = createMockMetric('number29');
export const mockMetric30 = createMockMetric('number30');

export const createMockListMetric = (id: string): BusterMetricListItem => ({
  id,
  title: faker.commerce.productName(),
  last_edited: faker.date.recent().toISOString(),
  dataset_name: faker.commerce.productName(),
  dataset_uuid: faker.string.uuid(),
  created_by_id: faker.string.uuid(),
  created_by_name: faker.person.fullName(),
  created_by_email: faker.internet.email(),
  created_by_avatar: faker.image.avatar(),
  status: VerificationStatus.VERIFIED,
  is_shared: true
});
