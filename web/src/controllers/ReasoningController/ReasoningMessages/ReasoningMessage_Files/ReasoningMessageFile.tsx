import React from 'react';
import {
  BusterChatMessageReasoning_file,
  BusterChatMessageReasoning_files
} from '@/api/asset_interfaces';
import { useMessageIndividual } from '@/context/Chats';
import { ReasoningFileButtons } from './ReasoningFileButtons';
import { StreamingMessageCode } from '@/components/ui/streaming/StreamingMessageCode';
import isEmpty from 'lodash/isEmpty';

export type ReasoningMessageFileProps = {
  chatId: string;
  fileId: string;
  messageId: string;
  reasoningMessageId: string;
  isCompletedStream: boolean;
};

export const ReasoningMessage_File: React.FC<ReasoningMessageFileProps> = React.memo(
  ({ isCompletedStream, fileId, chatId, messageId, reasoningMessageId }) => {
    const file: BusterChatMessageReasoning_file | undefined = useMessageIndividual(
      messageId,
      (x) =>
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files)?.files?.[
          fileId
        ]
    );

    if (isEmpty(file)) return null;

    const { status, file_type, version_id } = file;
    const isLoading = status === 'loading';
    const buttons = isLoading ? undefined : (
      <ReasoningFileButtons fileType={file_type} fileId={version_id} type="file" />
    );

    console.log(fileId, file);

    return (
      <StreamingMessageCode {...file} buttons={buttons} isCompletedStream={isCompletedStream} />
    );
  }
);

ReasoningMessage_File.displayName = 'ReasoningMessage_File';
