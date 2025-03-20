export interface TeamListParams {
  page_size?: number;
  page?: number;
  permission_group_id?: string | null;
  user_id?: string | null;
  belongs_to?: boolean | null;
}
