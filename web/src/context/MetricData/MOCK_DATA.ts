import { DataMetadata } from '@/api/asset_interfaces';
import type { BusterMetricData } from '../Metrics';
import { faker } from '@faker-js/faker';

const mockData = (): Record<string, string | number | null>[] => {
  return Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, (x, index) => ({
    sales: index + 1,
    date: faker.date.past({ years: index + 1 }).toISOString(),
    product: faker.commerce.productName()
  }));
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
  row_count: 1
};

const MOCK_DATA: Required<BusterMetricData> = {
  fetched: true,
  fetching: false,
  error: null,
  fetchedAt: Date.now(),
  data: mockData(),
  metricId: faker.string.uuid(),
  data_metadata: dataMetadata,
  dataFromRerun: null,
  code: `SELECT 
  sales,
  date,
  product
FROM sales_data 
WHERE date BETWEEN '2024-01-01' AND '2024-01-31'
ORDER BY date ASC`
};

export const createMockData = (metricId: string): Required<BusterMetricData> => {
  const data = mockData();
  return {
    ...MOCK_DATA,
    metricId,
    data: data,
    data_metadata: {
      ...dataMetadata,
      row_count: data.length
    }
  };
};
