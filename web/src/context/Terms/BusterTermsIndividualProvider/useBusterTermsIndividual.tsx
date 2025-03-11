import { useGetTerm } from '@/api/buster_rest/terms';

export const useBusterTermsIndividual = ({ termId }: { termId: string }) => {
  const { data: term, refetch: refetchTerm, isFetched: isFetchedTerm } = useGetTerm(termId);

  return {
    term,
    refetchTerm,
    isFetchedTerm
  };
};
