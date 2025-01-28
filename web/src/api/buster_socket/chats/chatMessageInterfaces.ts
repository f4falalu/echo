import type { FileType } from './config';

export type BusterChatMessage = {
  id: string;
  request_message: BusterChatMessageRequest;
  response_messages: BusterChatMessageResponse[];
  created_at: string;
};

export type BusterChatMessageRequest = {
  request: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
};

export type BusterChatMessageResponse =
  | BusterChatMessage_text
  | BusterChatMessage_thought
  | BusterChatMessage_file;

export type BusterChatMessage_text = {
  id: string;
  type: 'text';
  message: string;
  message_chunk: string;
};

export type BusterChatMessage_thoughtPill = {
  text: string;
  type: FileType;
  id: string;
};

export type BusterChatMessage_thought = {
  id: string;
  type: 'thought';
  thought_title: string;
  thought_secondary_title: string;
  thought_pills?: BusterChatMessage_thoughtPill[];
  hidden?: boolean; //if left undefined, will automatically be set to false if stream has ended
  in_progress?: boolean; //if left undefined, will automatically be set to true if the chat stream is in progress AND there is no message after it
};

export type BusterChatMessage_fileMetadata = {
  status: 'loading' | 'completed' | 'failed';
  message: string;
  timestamp?: number;
};

export type BusterChatMessage_file = {
  id: string;
  type: 'file';
  file_type: FileType;
  version_number: number;
  version_id: string;
  metadata?: BusterChatMessage_fileMetadata[];
  hidden?: boolean; //if left undefined, will automatically be set to true
};
