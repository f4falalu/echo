import { CreateTeamParams } from '@/api/request_interfaces/teams/interfaces';
import { createTeam } from './requests';
import { useMemoizedFn } from 'ahooks';
import { useMutation } from '@tanstack/react-query';

export const useCreateTeam = () => {
  const mutationFn = useMemoizedFn((params: CreateTeamParams) => {
    return createTeam(params);
  });

  return useMutation({
    mutationFn
  });
};
