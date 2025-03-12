import { IDataResult } from '@/api/asset_interfaces/metric/interfaces';
import { faker } from '@faker-js/faker';

// Helper to generate dates for time series
const generateDates = (count: number) => {
  const dates: Date[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - count);

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
};

// Line chart mock data
export const generateLineChartData = (pointCount = 10): IDataResult => {
  const dates = generateDates(pointCount);
  return dates.map((date) => ({
    date: date.toISOString(),
    revenue: faker.number.int({ min: 1000, max: 10000 }),
    profit: faker.number.int({ min: 100, max: 5000 }),
    customers: faker.number.int({ min: 50, max: 500 })
  }));
};

// Bar chart mock data
export const generateBarChartData = (categoryCount = 6): IDataResult => {
  return Array.from({ length: categoryCount }, () => ({
    category: faker.commerce.department(),
    sales: faker.number.int({ min: 1000, max: 10000 }),
    units: faker.number.int({ min: 50, max: 500 }),
    returns: faker.number.int({ min: 0, max: 50 })
  }));
};

// Pie chart mock data
export const generatePieChartData = (segmentCount = 5): IDataResult => {
  return Array.from({ length: segmentCount }, () => ({
    segment: faker.commerce.product(),
    value: faker.number.int({ min: 100, max: 1000 })
  }));
};

// Scatter chart mock data
export const generateScatterChartData = (pointCount = 30): IDataResult => {
  return Array.from({ length: pointCount }, () => ({
    x: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    y: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    size: faker.number.int({ min: 10, max: 50 }),
    category: faker.commerce.department()
  }));
};
