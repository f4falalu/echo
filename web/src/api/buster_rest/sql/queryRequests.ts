import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runSQL } from './requests';

export const useRunSQL = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runSQL
  });
};
