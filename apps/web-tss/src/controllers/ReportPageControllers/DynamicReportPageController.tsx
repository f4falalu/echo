import { lazy } from 'react';

export const DynamicReportPageController = lazy(() =>
  import('./ReportPageController').then((mod) => ({
    default: mod.ReportPageController,
  }))
);
