import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { prefetchGetReport } from '@/api/buster_rest/reports';

export const validateSearch = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const loader = async ({
  params: { reportId },
  context: { queryClient },
  deps: { report_version_number },
}: {
  params: { reportId: string };
  deps: { report_version_number?: number };
  context: { queryClient: QueryClient };
}): Promise<{ title: string | undefined }> => {
  const data = await prefetchGetReport(reportId, report_version_number, queryClient);
  return {
    title: data?.name,
  };
};

export const staticData = {
  assetType: 'report' as AssetType,
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Report' },
    { name: 'description', content: 'View detailed report data and analysis' },
    { name: 'og:title', content: 'Report' },
    { name: 'og:description', content: 'View detailed report data and analysis' },
  ],
});
