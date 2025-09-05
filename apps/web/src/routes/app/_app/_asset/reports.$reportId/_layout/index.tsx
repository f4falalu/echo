import { createFileRoute } from '@tanstack/react-router';
import * as reportIndexServerAssetContext from '@/context/BusterAssets/report-server/reportContentServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/reports/$reportId/_layout/')({
  ...reportIndexServerAssetContext,
});
