import { UserDatasetsController } from './UserDatasetsController';
import { prefetchGetUserDatasets } from '@/api/buster-rest/users';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function Page({ params }: { params: { userId: string } }) {
  const queryClient = await prefetchGetUserDatasets(params.userId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserDatasetsController userId={params.userId} />
    </HydrationBoundary>
  );
}
