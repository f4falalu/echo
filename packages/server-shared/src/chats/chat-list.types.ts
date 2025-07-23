import { z } from 'zod';

export const ChatListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  is_favorited: z.boolean(),
  updated_at: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string(),
  created_by_avatar: z.string().nullable(),
  last_edited: z.string(),
  latest_file_id: z.string().nullable(),
  latest_file_type: z.enum(['metric', 'dashboard']),
  latest_version_number: z.number().nullable(),
  latest_file_name: z.string().nullable(),
});

export type ChatListItem = z.infer<typeof ChatListItemSchema>;
