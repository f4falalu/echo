import { createFileRoute } from '@tanstack/react-router';
import * as reportIndexServerAssetContext from '@/context/BusterAssets/report-server/reportIndexServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/_reports/chats/$chatId/reports/$reportId/')({
  ...reportIndexServerAssetContext,
});
