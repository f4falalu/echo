import { createFileRoute } from '@tanstack/react-router';
import * as reportLayoutServerAssetContext from '@/context/BusterAssets/report-server/reportLayoutServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/_reports/reports/$reportId')({
  ...reportLayoutServerAssetContext,
});
