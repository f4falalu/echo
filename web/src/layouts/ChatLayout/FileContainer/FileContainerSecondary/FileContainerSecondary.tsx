import type { FileType } from '@/api/asset_interfaces/chat';
import type { FileContainerSecondaryProps } from './interfaces';
import type {
  DashboardFileViewSecondary,
  MetricFileViewSecondary
} from '../../ChatLayoutContext/useLayoutConfig/interfaces';

const MetricSecondaryRecord: Record<
  MetricFileViewSecondary,
  React.FC<FileContainerSecondaryProps>
> = {
  'chart-edit': () => null,
  'sql-edit': () => null,
  'version-history': () => null
};

const DashboardSecondaryRecord: Record<
  DashboardFileViewSecondary,
  React.FC<FileContainerSecondaryProps>
> = {
  'version-history': () => null
};

const SelectedFileSecondaryRecord: Record<
  FileType,
  Record<string, React.FC<FileContainerSecondaryProps>>
> = {
  metric: MetricSecondaryRecord,
  dashboard: DashboardSecondaryRecord,
  reasoning: {}
};
