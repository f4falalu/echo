import { createFileRoute } from '@tanstack/react-router';
import * as metricSQLServerAsssetContext from '@/context/BusterAssets/metric-server/metricSQLServerAsssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/chats/$chatId/reports/$reportId/metrics/$metricId/_content/sql'
)({
  ...metricSQLServerAsssetContext,
});
