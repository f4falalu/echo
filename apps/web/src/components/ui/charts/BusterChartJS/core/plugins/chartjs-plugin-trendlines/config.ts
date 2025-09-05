import type { Trendline } from '@buster/server-shared/metrics';

type TrendlineType = Trendline['type'];

export const TypeToLabel: Record<TrendlineType, string> = {
  linear_regression: 'Linear',
  logarithmic_regression: 'Logarithmic',
  exponential_regression: 'Exponential',
  polynomial_regression: 'Polynomial',
  min: 'Min',
  max: 'Max',
  median: 'Median',
  average: 'Average',
};
