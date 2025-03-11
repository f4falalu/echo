import { useUpdateTerm } from '@/api/buster_rest/terms';

export const useBusterTermsUpdate = () => {
  const { mutate: updateTerm } = useUpdateTerm();

  return {
    updateTerm
  };
};
