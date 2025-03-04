import type { FileType, ThoughtFileType } from './config';

export type BusterChatMessage = {
  id: string;
  request_message: BusterChatMessageRequest;
  response_messages: BusterChatMessageResponse[];
  reasoning: BusterChatMessageReasoning[];
  created_at: string;
  final_reasoning_message: string | null;
};

export type BusterChatMessageRequest = null | {
  request: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
};

export type BusterChatMessageResponse = BusterChatMessage_text | BusterChatMessage_file;

export type BusterChatMessage_text = {
  id: string;
  type: 'text';
  message: string;
  message_chunk?: string;
  is_final_message?: boolean; //defaults to false
};

export type BusterChatMessageReasoning_status = 'loading' | 'completed' | 'failed';

export type BusterChatMessage_fileMetadata = {
  status: BusterChatMessageReasoning_status;
  message: string;
  timestamp?: number;
};

export type BusterChatMessage_file = {
  id: string;
  type: 'file';
  file_type: FileType;
  file_name: string;
  version_number: number;
  version_id: string;
  filter_version_id: string | null;
  metadata?: BusterChatMessage_fileMetadata[];
};

export type BusterChatMessageReasoning =
  | BusterChatMessageReasoning_Pills
  | BusterChatMessageReasoning_text
  | BusterChatMessageReasoning_files;

export type BusterChatMessageReasoning_Pill = {
  text: string;
  type: ThoughtFileType | null; //if null then the pill will not link anywhere
  id: string;
};

export type BusterChatMessageReasoning_PillContainer = {
  title: string;
  pills: BusterChatMessageReasoning_Pill[];
};

export type BusterChatMessageReasoning_Pills = {
  id: string;
  type: 'pills';
  title: string;
  secondary_title?: string;
  pill_containers?: BusterChatMessageReasoning_PillContainer[];
  status?: BusterChatMessageReasoning_status; //if left undefined, will automatically be set to 'loading' if the chat stream is in progress AND there is no message after it
};

export type BusterChatMessageReasoning_text = {
  id: string;
  type: 'text';
  title: string;
  secondary_title?: string;
  message?: string;
  message_chunk?: string;
  status: BusterChatMessageReasoning_status;
};

export type BusterChatMessageReasoning_file = {
  id: string;
  file_type: FileType;
  file_name: string;
  version_number: number;
  version_id: string;
  status?: BusterChatMessageReasoning_status;
  file?: {
    text: string;
    line_number: number;
    modified?: boolean; //only toggle to true if we want to hide previous lines
  }[];
};

export type BusterChatMessageReasoning_files = {
  id: string;
  type: 'files';
  title: string;
  status: BusterChatMessageReasoning_status;
  secondary_title?: string;
  files: BusterChatMessageReasoning_file[];
};
