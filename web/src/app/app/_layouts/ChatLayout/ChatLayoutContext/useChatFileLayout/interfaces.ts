export interface FileConfig {
  selectedFileView: FileView;
  fileViewConfig?: FileViewConfig;
}

export type FileViewConfig = Partial<Record<FileView, { secondaryView: FileViewSecondary }>>;

export type FileView =
  | MetricFileView
  | DashboardFileView
  | TermFileView
  | ValueFileView
  | DatasetFileView
  | CollectionFileView;

export type MetricFileView = 'chart' | 'results' | 'file';
export type DashboardFileView = 'dashboard' | 'file';
export type TermFileView = 'file';
export type ValueFileView = 'file';
export type DatasetFileView = 'file';
export type CollectionFileView = 'file' | 'results';

export type FileViewSecondary = null | MetricFileViewSecondary;
export type MetricFileViewSecondary = 'chart-edit';
