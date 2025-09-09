import { createFileRoute } from '@tanstack/react-router';
import * as dashboardEmbedServerContext from '@/context/BusterAssets/dashboard-server/dashboardEmbedServerContext';

export const Route = createFileRoute('/embed/dashboard/$dashboardId')({
  ...dashboardEmbedServerContext,
});
