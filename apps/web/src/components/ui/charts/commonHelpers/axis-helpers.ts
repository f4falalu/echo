import type { ChartEncodes, ChartType } from '@buster/server-shared/metrics';
import isEmpty from 'lodash/isEmpty';

const defaultAxisCheck = (selectedAxis: ChartEncodes) => {
  if (isEmpty(selectedAxis.x) || isEmpty(selectedAxis.y)) return false;
  return true;
};

const AxisMethodCheckRecord: Record<ChartType, (selectedAxis: ChartEncodes) => boolean> = {
  line: defaultAxisCheck,
  bar: defaultAxisCheck,
  scatter: defaultAxisCheck,
  pie: defaultAxisCheck,
  combo: defaultAxisCheck,
  metric: () => true,
  table: () => true
};

export const doesChartHaveValidAxis = ({
  selectedAxis,
  isTable,
  selectedChartType
}: {
  selectedChartType: ChartType;
  selectedAxis: ChartEncodes | undefined;
  isTable: boolean;
}) => {
  if (isTable) return true;

  return AxisMethodCheckRecord[selectedChartType](selectedAxis as ChartEncodes);
};
