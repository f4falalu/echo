export interface FileConfig {
  selectedFileView: FileView;
  fileViewConfig?: FileViewConfig;
}

export type FileViewConfig = Partial<
  Record<
    FileView,
    {
      secondaryView: FileViewSecondary;
      renderView?: boolean; //this is really just used for metric because it has a vertical view and we don't want to render a right panel. undefined defaults to true
    }
  >
>;

export type FileView =
  | MetricFileView
  | DashboardFileView
  | TermFileView
  | ValueFileView
  | DatasetFileView
  | CollectionFileView
  | ReasoningFileView;

export type MetricFileView = 'chart' | 'results' | 'file';
export type DashboardFileView = 'dashboard' | 'file';
export type TermFileView = 'file';
export type ValueFileView = 'file';
export type DatasetFileView = 'file';
export type CollectionFileView = 'file' | 'results';
export type ReasoningFileView = 'reasoning';

export type MetricFileViewSecondary = 'chart-edit' | 'sql-edit' | 'version-history';
export type DashboardFileViewSecondary = 'version-history';
export type FileViewSecondary = null | MetricFileViewSecondary | DashboardFileViewSecondary;
