import { createFileRoute } from '@tanstack/react-router';
import * as metricSQLServerAsssetContext from '@/context/BusterAssets/metric-server/metricSQLServerAsssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/_metrics/chats/$chatId/metrics/$metricId/sql'
)({
  ...metricSQLServerAsssetContext,
});
