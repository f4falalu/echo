export interface ChatListItem {
  id: string;
  title: string;
  is_favorited: boolean;
  updated_at: string;
  created_at: string;
  created_by: string;
  created_by_id: string;
  created_by_name: string;
  created_by_avatar: string | null;
  last_edited: string;
  latest_file_id: string | null;
  latest_file_type: 'metric' | 'dashboard';
  latest_version_number?: number;
}
