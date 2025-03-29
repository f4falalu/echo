import React, { useMemo } from 'react';
import {
  BusterChatMessageReasoning_file,
  BusterChatMessageReasoning_files
} from '@/api/asset_interfaces';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { ReasoningFileButtons } from './ReasoningFileButtons';
import { StreamingMessageCode } from '@/components/ui/streaming/StreamingMessageCode';
import isEmpty from 'lodash/isEmpty';
import { Text } from '@/components/ui/typography';
import { CircleSpinnerLoader } from '@/components/ui/loaders';
import { CheckDouble, AlertWarning } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'framer-motion';

export type ReasoningMessageFileProps = {
  chatId: string;
  fileId: string;
  messageId: string;
  reasoningMessageId: string;
  isCompletedStream: boolean;
};

export const ReasoningMessage_File: React.FC<ReasoningMessageFileProps> = React.memo(
  ({ isCompletedStream, fileId, chatId, messageId, reasoningMessageId }) => {
    const file: BusterChatMessageReasoning_file | undefined = useGetChatMessage(
      messageId,
      (x) =>
        (x?.reasoning_messages[reasoningMessageId] as BusterChatMessageReasoning_files)?.files?.[
          fileId
        ]
    );

    if (isEmpty(file)) return null;

    const { status, file_type, version_id } = file;

    const buttons = !isCompletedStream ? (
      <StreamingMessageStatus status={status} />
    ) : (
      <ReasoningFileButtons fileType={file_type} chatId={chatId} fileId={version_id} type="file" />
    );

    return (
      <StreamingMessageCode {...file} buttons={buttons} isCompletedStream={isCompletedStream} />
    );
  }
);

ReasoningMessage_File.displayName = 'ReasoningMessage_File';

const StreamingMessageStatus = React.memo(
  ({ status }: { status: BusterChatMessageReasoning_file['status'] }) => {
    const content = useMemo(() => {
      if (status === 'loading')
        return (
          <Text variant={'secondary'} size={'sm'} className="flex gap-1.5">
            Running SQL... <CircleSpinnerLoader size={9} fill={'var(--color-text-secondary)'} />
          </Text>
        );
      if (status === 'completed')
        return (
          <Text variant={'secondary'} size={'sm'} className="flex gap-1.5">
            Completed <CheckDouble />
          </Text>
        );
      if (status === 'failed')
        return (
          <Text variant={'danger'} size={'sm'} className="flex gap-1.5">
            Failed <AlertWarning />
          </Text>
        );
    }, [status]);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          key={status}>
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }
);

StreamingMessageStatus.displayName = 'StreamingMessageStatus';
