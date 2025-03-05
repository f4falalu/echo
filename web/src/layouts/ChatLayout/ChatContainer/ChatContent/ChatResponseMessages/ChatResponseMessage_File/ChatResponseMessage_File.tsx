import React, { useMemo } from 'react';
import { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import type {
  BusterChatResponseMessage_file,
  BusterChatResponseMessage_fileMetadata
} from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { motion, AnimatePresence } from 'framer-motion';
import { itemAnimationConfig } from '@/components/ui/streaming/animationConfig';
import { useMemoizedFn } from 'ahooks';
import { StatusIndicator } from '@/components/ui/indicators';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { VersionPill } from '@/components/ui/tags/VersionPill';
import { useMessageIndividual } from '@/context/Chats';
import { cn } from '@/lib/classMerge';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessageId, messageId, isCompletedStream }) => {
    const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
    const isSelectedFile = useChatIndividualContextSelector((x) => x.selectedFileId === id);
    const responseMessage = useMessageIndividual(
      messageId,
      (x) => x?.response_messages?.[responseMessageId]
    );
    const {
      file_name,
      file_type,
      version_number,
      id,
      metadata = []
    } = (responseMessage || {}) as BusterChatResponseMessage_file;

    const onClickCard = useMemoizedFn(() => {
      onSetSelectedFile({
        id,
        type: file_type
      });
    });

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div id={id} {...itemAnimationConfig} className="flex flex-col">
          <div
            onClick={onClickCard}
            className={cn(
              'border-border hover:border-text-tertiary flex cursor-pointer flex-col items-center overflow-hidden rounded border transition-all duration-200 hover:shadow',
              isSelectedFile && 'border-black shadow'
            )}>
            <ChatResponseMessageHeader file_name={file_name} version_number={version_number} />
            <ChatResponseMessageBody metadata={metadata} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';

const ChatResponseMessageHeader: React.FC<{ file_name: string; version_number: number }> =
  React.memo(({ file_name, version_number }) => {
    return (
      <div className="file-header bg-item-hover border-border flex h-8 w-full items-center space-x-1.5 overflow-hidden border-b px-2.5">
        <Text truncate>{file_name}</Text>
        <VersionPill version_number={version_number} />
      </div>
    );
  });

ChatResponseMessageHeader.displayName = 'ChatResponseMessageHeader';

const ChatResponseMessageBody: React.FC<{
  metadata: BusterChatResponseMessage_fileMetadata[];
}> = React.memo(({ metadata }) => {
  return (
    <div className="flex w-full flex-col items-center space-y-0.5 px-2.5 py-2">
      {metadata.map((metadata, index) => (
        <MetadataItem metadata={metadata} key={index} />
      ))}
    </div>
  );
});

ChatResponseMessageBody.displayName = 'ChatResponseMessageBody';

const MetadataItem: React.FC<{ metadata: BusterChatResponseMessage_fileMetadata }> = ({
  metadata
}) => {
  const { status, message, timestamp } = metadata;

  const timestampFormatted = useMemo(() => {
    if (!timestamp) return '';
    return `${timestamp} seconds`;
  }, [timestamp]);

  return (
    <div
      className="@container flex w-full items-center justify-start space-x-1.5 overflow-hidden"
      style={{
        containerType: 'inline-size'
      }}>
      <div>
        <StatusIndicator status={status} />
      </div>

      <Text truncate size="xs" variant="secondary">
        {message}
      </Text>

      {timestamp && (
        <Text variant="tertiary" className="whitespace-nowrap @[190px]:hidden" size="xs">
          {timestampFormatted}
        </Text>
      )}
    </div>
  );
};
