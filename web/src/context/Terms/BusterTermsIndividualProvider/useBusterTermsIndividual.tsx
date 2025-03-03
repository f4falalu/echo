import { queryKeys } from '@/api/query_keys';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';

export const useBusterTermsIndividual = ({ termId }: { termId: string }) => {
  const {
    data: term,
    refetch: refetchTerm,
    isFetched: isFetchedTerm
  } = useSocketQueryEmitOn({
    emitEvent: { route: '/terms/get', payload: { id: termId } },
    responseEvent: '/terms/get:GetTerm',
    options: queryKeys.termsGetTerm(termId),
    enabledTrigger: termId
  });

  return {
    term,
    refetchTerm,
    isFetchedTerm
  };
};
