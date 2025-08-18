import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, useMatches, useParams, useSearch } from '@tanstack/react-router';
import { z } from 'zod';

const searchParamsSchema = z.object({
  metric_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId')({
  loader: async ({ params, context }) => {
    const title = await context.getAssetTitle({
      assetId: params.metricId,
      assetType: 'metric',
    });
    return {
      title,
    };
  },
  staticData: {
    assetType: 'metric' as Extract<AssetType, 'metric'>,
  },
  validateSearch: searchParamsSchema,
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Metric' },
      { name: 'description', content: 'View detailed metric analysis and insights' },
      { name: 'og:title', content: 'Metric' },
      { name: 'og:description', content: 'View detailed metric analysis and insights' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const params = useParams({ from: '/app/_app/_asset/metrics/$metricId' });
  const search = useSearch({ from: '/app/_app/_asset/metrics/$metricId' });

  // const assetType = useMatches({
  //   select: (matches) => {
  //     const hit = [...matches]
  //       .reverse()
  //       .find(
  //         (m) => m.staticData && typeof m.staticData === 'object' && 'assetType' in m.staticData
  //       );
  //     return hit?.staticData && typeof hit.staticData === 'object' && 'assetType' in hit.staticData
  //       ? (hit.staticData as { assetType: AssetType }).assetType
  //       : 'unknown';
  //   },
  // });

  const matches = useMatches();
  const test = matches.map((match) => {
    return <div key={match.id}>{JSON.stringify(match.staticData)}</div>;
  });

  return <div>Hello "/app/metrics/$metricId"! wow</div>;
}
