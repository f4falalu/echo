export interface ChatListParams {
  /** Pagination token indicating the page number */
  page_token: number;
  /** Number of chat items to return per page */
  page_size: number;
  /** When true, shows all organization chats (admin only). When false, shows only user's chats */
  admin_view: boolean;
}
