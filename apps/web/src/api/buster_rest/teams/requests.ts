import type { TeamListResponse, GetTeamListRequest } from '@buster/server-shared/teams';
import { mainApi } from '../instances';

export const createTeam = async (params: {
  /** The name of the team */
  name: string;
  /** Optional description of the team */
  description?: string;
}) => {
  return mainApi.post<{ id: string }>('/teams', params).then((res) => res.data);
};

export const getTeamsList = async (params: GetTeamListRequest) => {
  return mainApi.get<TeamListResponse>('/teams', { params }).then((res) => res.data);
};
