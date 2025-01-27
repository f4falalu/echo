import type { BusterChatMessage } from './chatMessageInterfaces';

export interface BusterChat {
  id: string;
  title: string;
  is_favorited: boolean;
  messages: BusterChatMessage[];
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_id: string;
  created_by_name: string;
  created_by_avatar: string | null;
  // pinned_message_id: string | null;
  // pinned_metric_id: string | null;
}

export interface BusterChatListItem {
  id: string;
  title: string;
  is_favorited: boolean;
  updated_at: string;
  created_at: string;
  created_by: string;
  created_by_id: string;
  created_by_name: string;
  created_by_avatar: string | null;
}
