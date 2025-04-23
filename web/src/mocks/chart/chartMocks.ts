import { IDataResult } from '@/api/asset_interfaces/metric/interfaces';
import dayjs from 'dayjs';

// Helper to generate dates for time series
const generateDates = (count: number) => {
  const dates: Date[] = [];
  const startDate = dayjs('April 1, 2025').toDate();

  for (let i = 0; i < count; i++) {
    const date = dayjs(startDate).add(i, 'day').toDate();
    dates.push(date);
  }
  return dates;
};

// Helper to add controlled noise to values
export const addNoise = (value: number, variabilityPercent: number = 10): number => {
  const maxNoise = value * (variabilityPercent / 100);
  const noise = Math.sin(value) * maxNoise; // Using sin for pseudo-random but predictable noise
  return Math.round(value + noise);
};

// Line chart mock data with predictable growth patterns and controlled variability
export const generateLineChartData = (pointCount = 10): IDataResult => {
  const dates = generateDates(pointCount);
  return dates.map((date, index) => {
    const baseRevenue = 1000 + index * 500;
    const baseProfit = 100 + index * 200;
    const baseCustomers = 50 + index * 25;

    return {
      date: date.toISOString(),
      revenue: addNoise(baseRevenue, 15), // 15% variability
      profit: addNoise(baseProfit, 20), // 20% variability
      customers: addNoise(baseCustomers, 10), // 10% variability,
      category: ['Electronics', 'Clothing', 'Food'][index % 3]
    };
  });
};

// Bar chart mock data with consistent categories
export const generateBarChartData = (categoryCount = 6): IDataResult => {
  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Beauty'];
  return Array.from({ length: categoryCount }, (_, index) => ({
    category: categories[index % categories.length],
    sales: 1000 + index * 1000, // Increases by 1000 each category
    units: 50 + index * 50, // Increases by 50 each category
    returns: 100 + index * 25 // Increases by 25 each category
  }));
};

// Pie chart mock data with fixed segments
export const generatePieChartData = (segmentCount = 5): IDataResult => {
  const segments = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
  return Array.from({ length: segmentCount }, (_, index) => ({
    segment: segments[index % segments.length],
    value: 100 + index * 200 // Increases by 200 each segment
  }));
};

// Scatter chart mock data with predictable patterns
export const generateScatterChartData = (pointCount = 30): IDataResult => {
  const categories = ['Electronics', 'Clothing', 'Home Goods'];
  return Array.from({ length: pointCount }, (_, index) => ({
    x: (index % 10) * 10, // Values from 0-90 in steps of 10
    y: Math.floor(index / 10) * 10, // Creates a grid pattern,
    y2: Math.floor(index / 10) * 40, // Creates a grid pattern,
    size: 10 + (index % 5) * 10, // Sizes cycle between 10-50 in steps of 10
    category: categories[index % categories.length]
  }));
};
