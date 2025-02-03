import { BusterChat } from './chatInterfaces';

export const defaultBusterChat: Required<BusterChat> = {
  id: '',
  title: '',
  is_favorited: false,
  messages: [],
  created_at: '',
  updated_at: '',
  created_by: '',
  created_by_id: '',
  created_by_name: '',
  created_by_avatar: ''
};
