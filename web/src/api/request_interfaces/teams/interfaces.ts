/**
 * Parameters for creating a new team
 */
export interface CreateTeamParams {
  /** The name of the team */
  name: string;
  /** Optional description of the team */
  description?: string;
}

export interface TeamListParams {
  page_size?: number;
  page?: number;
  permission_group_id?: string | null;
  user_id?: string | null;
  belongs_to?: boolean | null;
}
