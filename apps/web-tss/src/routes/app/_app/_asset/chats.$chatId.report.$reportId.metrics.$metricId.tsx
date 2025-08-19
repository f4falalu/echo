import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricIndexServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/chats/$chatId/report/$reportId/metrics/$metricId'
)({
  ...metricServerContext,
});
