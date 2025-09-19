export * from './chat.types';
export * from './chat-errors.types';
export * from './chat-message.types';
export * from './chat-list.types';
export * from './requests';
export * from './responses';

// Re-export message schemas from database package to maintain backward compatibility
// Using /types entry point to avoid triggering database connection
export {
  StatusSchema,
  ResponseMessageSchema,
  ReasoningMessageSchema,
  type ChatMessageReasoning_status,
  type ChatMessageResponseMessage,
  type ChatMessageReasoningMessage,
  type ChatMessageReasoningMessage_Text,
  type ChatMessageReasoningMessage_Files,
  type ChatMessageReasoningMessage_Pills,
  type ChatMessageReasoningMessage_File,
  type ChatMessageReasoningMessage_Pill,
  type ChatMessageReasoningMessage_PillContainer,
  type ChatMessageResponseMessage_FileMetadata,
  type ChatMessageResponseMessage_Text,
  type ChatMessageResponseMessage_File,
  type ReasoningFileType,
  type ResponseMessageFileType,
  type ReasoningMessage_ThoughtFileType,
} from '@buster/database/schema-types';
