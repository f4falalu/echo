import type { MetricFileView } from '@/app/app/_layouts/ChatLayout';
import { MetricViewChart } from './MetricViewChart';
import { MetricViewFile } from './MetricViewFile';
import { MetricViewResults } from './MetricViewResults';

interface MetricViewProps {
  selectedFileView: MetricFileView;
}

export const MetricViewComponents: Record<MetricFileView, React.FC<MetricViewProps>> = {
  chart: MetricViewChart,
  results: MetricViewResults,
  file: MetricViewFile
};
