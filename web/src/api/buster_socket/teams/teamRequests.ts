import type { BusterSocketRequestBase } from '../base_interfaces';

/**
 * Represents a request to list teams with optional filtering and pagination parameters.
 * @template {'/teams/list'} - The endpoint path for listing teams
 * @param {Object} params - The parameters for the teams list request
 * @param {number} [params.page_size] - The number of teams to return per page
 * @param {number} [params.page] - The page number to retrieve
 * @param {string | null} [params.permission_group_id] - Filter teams by permission group ID
 * @param {string | null} [params.user_id] - Filter teams by user ID
 * @param {boolean | null} [params.belongs_to] - Filter teams by user membership
 */
export type TeamRequestsList = BusterSocketRequestBase<
  '/teams/list',
  {
    page_size?: number;
    page?: number;
    permission_group_id?: null | string;
    user_id?: null | string;
    belongs_to?: boolean | null;
  }
>;

export type TeamEmits = TeamRequestsList;
