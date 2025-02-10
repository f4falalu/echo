import React from 'react';
import { ReasoningMessageProps } from '../ReasoningMessageSelector';
import { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import { AppCodeBlock } from '@/components/text/AppMarkdown/AppCodeBlock';

export const ReasoningMessage_File: React.FC<ReasoningMessageProps> = React.memo(
  ({ reasoningMessage, isCompletedStream, isLastMessageItem }) => {
    const { file, file_name, file_type, file_chunk } =
      reasoningMessage as BusterChatMessageReasoning_file;

    const showLoader = !isCompletedStream && isLastMessageItem;

    return (
      <AppCodeBlock
        title={file_name}
        language={'yaml'}
        showCopyButton={false}
        showLoader={showLoader}>
        {file?.map((chunk) => chunk.text).join('\n')}
      </AppCodeBlock>
    );
  }
);

ReasoningMessage_File.displayName = 'ReasoningMessage_File';
