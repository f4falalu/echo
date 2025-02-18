import type { BusterTerm } from '@/api/asset_interfaces';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryOptions } from '@tanstack/react-query';

export const useBusterTermsUpdate = () => {
  const { mutate: updateTerm } = useSocketQueryMutation({
    emitEvent: '/terms/update',
    responseEvent: '/terms/update:UpdateTerm',
    options: queryOptions<BusterTerm>({ queryKey: [] }),
    callback: (currentData, variables) => {
      return {
        ...currentData!,
        ...variables
      };
    }
  });

  return {
    updateTerm
  };
};
