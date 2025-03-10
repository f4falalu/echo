import type { DataMetadata, BusterMetricData } from '@/api/asset_interfaces/metric';
import { faker } from '@faker-js/faker';

const mockData = (): Record<string, string | number | null>[] => {
  return Array.from({ length: faker.number.int({ min: 2, max: 100 }) }, (x, index) => ({
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
  data: mockData(),
  metricId: faker.string.uuid(),
  data_metadata: dataMetadata,
  dataFromRerun: null
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
