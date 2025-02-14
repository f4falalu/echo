import { queryKeys } from '@/api/asset_interfaces';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';

export const useBusterTermsIndividual = ({ termId }: { termId: string }) => {
  const {
    data: term,
    refetch: refetchTerm,
    isFetched: isFetchedTerm
  } = useSocketQueryEmitOn(
    { route: '/terms/get', payload: { id: termId } },
    '/terms/get:GetTerm',
    queryKeys['/terms/get:getTerm'](termId),
    null,
    termId
  );

  return {
    term,
    refetchTerm,
    isFetchedTerm
  };
};
