import { BusterUserTeam } from '@/api/asset_interfaces/users';
import { mainApi } from '../instances';
import type { TeamListParams } from '@/api/request_interfaces/teams';

export const createTeam = async (params: {
  /** The name of the team */
  name: string;
  /** Optional description of the team */
  description?: string;
}) => {
  return mainApi.post<{ id: string }>('/teams', params).then((res) => res.data);
};

export const getTeamsList = async (params: TeamListParams) => {
  return mainApi.get<BusterUserTeam[]>('/teams', { params }).then((res) => res.data);
};
