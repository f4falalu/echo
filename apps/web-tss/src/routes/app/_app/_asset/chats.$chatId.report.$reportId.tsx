import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import * as reportServerContext from '@/context/BusterAssets/report-server/reportServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/report/$reportId')({
  ...reportServerContext,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId/report/$reportId"!</div>;
}
