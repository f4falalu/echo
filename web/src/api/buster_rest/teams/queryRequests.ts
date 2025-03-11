import type { TeamListParams } from '@/api/request_interfaces/teams';
import { createTeam, getTeamsList } from './requests';
import { useMutation, useQuery } from '@tanstack/react-query';

export const useCreateTeam = () => {
  return useMutation({
    mutationFn: createTeam
  });
};

export const useGetTeamsList = (params: TeamListParams) => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeamsList(params)
  });
};
