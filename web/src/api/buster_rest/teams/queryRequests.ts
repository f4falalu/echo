import { useCreateReactMutation } from '@/api/createReactQuery';
import { CreateTeamParams } from '@/api/request_interfaces/teams/interfaces';
import { createTeam } from './requests';
import { useMemoizedFn } from 'ahooks';

export const useCreateTeam = () => {
  const mutationFn = useMemoizedFn((params: CreateTeamParams) => {
    return createTeam(params);
  });

  return useCreateReactMutation({
    mutationFn
  });
};
