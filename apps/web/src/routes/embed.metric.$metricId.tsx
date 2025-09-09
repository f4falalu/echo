import { createFileRoute } from '@tanstack/react-router';
import * as metricEmbedServerContext from '@/context/BusterAssets/metric-server/metricEmbedServerContext';

export const Route = createFileRoute('/embed/metric/$metricId')({
  ...metricEmbedServerContext,
});
