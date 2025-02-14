import { BusterTerm } from '@/api/asset_interfaces';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryOptions } from '@tanstack/react-query';

export const useBusterTermsUpdate = () => {
  const { mutate: updateTerm } = useSocketQueryMutation(
    '/terms/update',
    '/terms/update:UpdateTerm',
    queryOptions<BusterTerm>({ queryKey: [] }),
    (currentData, variables) => {
      return {
        ...currentData!,
        ...variables
      };
    }
  );

  return {
    updateTerm
  };
};
