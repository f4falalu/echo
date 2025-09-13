// Export request types and schemas
export {
  shortcutNameSchema,
  createShortcutRequestSchema,
  updateShortcutRequestSchema,
  type CreateShortcutRequest,
  type UpdateShortcutRequest,
} from './requests.types';

// Export response types and schemas
export {
  shortcutSchema,
  listShortcutsResponseSchema,
  shortcutErrorSchema,
  type Shortcut,
  type ListShortcutsResponse,
  type ShortcutError,
} from './responses.types';
