import React, { useMemo } from 'react';
import type {
  BusterChatResponseMessage_file,
  BusterChatResponseMessage_fileMetadata
} from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { motion, AnimatePresence } from 'framer-motion';
import { itemAnimationConfig } from './animationConfig';
import { StatusIndicator } from '@/components/ui/indicators';
import { VersionPill } from '@/components/ui/tags/VersionPill';
import { cn } from '@/lib/classMerge';

export const StreamingMessage_File: React.FC<{
  isSelectedFile: boolean;
  onClick: () => void;
  responseMessage: BusterChatResponseMessage_file;
  isCompletedStream: boolean;
}> = React.memo(({ isCompletedStream, responseMessage, onClick, isSelectedFile }) => {
  const {
    file_name,
    version_number,
    id,
    metadata = []
  } = (responseMessage || {}) as BusterChatResponseMessage_file;

  return (
    <AnimatePresence initial={!isCompletedStream}>
      <motion.div
        id={id}
        {...itemAnimationConfig}
        onClick={onClick}
        className={cn(
          'border-border hover:border-text-tertiary flex cursor-pointer flex-col items-center overflow-hidden rounded border transition-all duration-200 hover:shadow',
          isSelectedFile && 'border-black shadow'
        )}>
        <StreamHeader file_name={file_name} version_number={version_number} />
        <StreamingMessageBody metadata={metadata} />
      </motion.div>
    </AnimatePresence>
  );
});

StreamingMessage_File.displayName = 'StreamingMessage_File';

const StreamHeader: React.FC<{ file_name: string; version_number: number }> = React.memo(
  ({ file_name, version_number }) => {
    return (
      <div className="file-header bg-item-select border-border flex h-8 w-full items-center space-x-1.5 overflow-hidden border-b px-2.5">
        <Text truncate>{file_name}</Text>
        <VersionPill version_number={version_number} />
      </div>
    );
  }
);

StreamHeader.displayName = 'ChatResponseMessageHeader';

const StreamingMessageBody: React.FC<{
  metadata: BusterChatResponseMessage_fileMetadata[];
}> = React.memo(({ metadata }) => {
  return (
    <div className="flex w-full flex-col items-center space-y-1 px-2.5 py-2">
      {metadata.map((metadata, index) => (
        <MetadataItem metadata={metadata} key={index} />
      ))}
    </div>
  );
});

StreamingMessageBody.displayName = 'ChatResponseMessageBody';

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
