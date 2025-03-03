import { mainApi } from '../instances';
import type { CreateTeamParams } from '@/api/request_interfaces/teams';

export const createTeam = async (params: CreateTeamParams) => {
  return mainApi.post<{ id: string }>('/teams', params).then((res) => res.data);
};
