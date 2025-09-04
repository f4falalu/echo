import { createFileRoute } from '@tanstack/react-router';
import * as metricSQLServerAsssetContext from '@/context/BusterAssets/metric-server/metricSQLServerAsssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/metrics/$metricId/_layout/sql'
)({
  ...metricSQLServerAsssetContext,
});
