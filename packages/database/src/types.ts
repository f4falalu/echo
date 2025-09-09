/**
 * Type-only exports for message schemas
 * This file provides types without triggering database connection
 */

// Export message schema types
export type {
  ChatMessageReasoning_status,
  ChatMessageResponseMessage,
  ChatMessageReasoningMessage,
  ChatMessageReasoningMessage_Text,
  ChatMessageReasoningMessage_Files,
  ChatMessageReasoningMessage_Pills,
  ChatMessageReasoningMessage_File,
  ChatMessageReasoningMessage_Pill,
  ChatMessageReasoningMessage_PillContainer,
  ChatMessageResponseMessage_FileMetadata,
  ChatMessageResponseMessage_Text,
  ChatMessageResponseMessage_File,
  ReasoningFileType,
  ResponseMessageFileType,
  ReasoingMessage_ThoughtFileType,
} from './schemas/message-schemas';

// Export the schemas themselves (these are just objects, no side effects)
export {
  StatusSchema,
  ResponseMessageSchema,
  ReasoningMessageSchema,
} from './schemas/message-schemas';
