import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import {
  BeforeLoadContextOptions,
  type BeforeLoadContextParameter,
  type BeforeLoadFn,
  redirect,
} from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import type { FileRouteTypes } from '@/routeTree.gen';

export const validateSearch = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const staticData = {
  assetType: 'metric' as AssetType,
};

// biome-ignore lint/suspicious/noExplicitAny: because of tanstack router types, we need to use any
export const beforeLoad: any = async ({
  matches,
  params,
  search,
}: {
  matches: { routeId: FileRouteTypes['id'] }[];
  params: {
    metricId: string;
  };
  search: {
    metric_version_number?: number;
  };
}): Promise<void> => {
  const lastMatch = matches[matches.length - 1];
  const _typeCheck = lastMatch.routeId === '/app/_app/_asset/metrics/$metricId'; //thisis just here to make sure the type is correct so we can be remined to change the endWiths
  const isIndexRoute = lastMatch.routeId.endsWith('metrics/$metricId');
  if (isIndexRoute) {
    throw redirect({
      //relative path required the use of as...
      to: './chart' as '/app/metrics/$metricId/chart',
      params,
      search,
    });
  }
};

export const loader = async ({
  params: { metricId },
  context: { queryClient },
  deps: { metric_version_number },
}: {
  params: { metricId: string };
  deps: { metric_version_number?: number };
  context: { queryClient: QueryClient };
}): Promise<{ title: string | undefined }> => {
  const data = await prefetchGetMetric(
    { id: metricId, version_number: metric_version_number },
    queryClient
  );
  return {
    title: data?.name,
  };
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Metric' },
    { name: 'description', content: 'View detailed metric analysis and insights' },
    { name: 'og:title', content: 'Metric' },
    { name: 'og:description', content: 'View detailed metric analysis and insights' },
  ],
});
