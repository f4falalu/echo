import { createFileRoute } from '@tanstack/react-router';
import * as metricServerContext from '@/context/BusterAssets/metric-server/metricLayoutServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/_metrics/collections/$collectionId/chats/$chatId/metrics/$metricId'
)({
  ...metricServerContext,
});
