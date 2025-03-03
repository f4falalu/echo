import React, { useMemo } from 'react';
import { ChatResponseMessageProps } from '../ChatResponseMessageSelector';
import { createStyles } from 'antd-style';
import type {
  BusterChatMessage_file,
  BusterChatMessage_fileMetadata
} from '@/api/asset_interfaces';
import { Text } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { itemAnimationConfig } from '@/components/ui/streaming/animationConfig';
import { useMemoizedFn } from 'ahooks';
import { StatusIndicator } from '@/components/ui/indicators';
import { useChatLayoutContextSelector } from '../../../../ChatLayoutContext';
import { useChatIndividualContextSelector } from '../../../../ChatContext';
import { VersionPill } from '@/components/ui/tags/VersionPill';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream }) => {
    const { cx, styles } = useStyles();
    const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
    const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
    const responseMessage = responseMessageProp as BusterChatMessage_file;
    const { file_name, file_type, version_number, id, metadata = [] } = responseMessage;
    const isSelectedFile = selectedFileId === id;

    const onClickCard = useMemoizedFn(() => {
      onSetSelectedFile({
        id,
        type: file_type
      });
    });

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div id={id} {...itemAnimationConfig} className={cx('flex flex-col')}>
          <div
            onClick={onClickCard}
            className={cx(
              styles.fileContainer,
              isSelectedFile && 'selected',
              'transition duration-200',
              'flex flex-col items-center',
              'cursor-pointer overflow-hidden'
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
    const { cx, styles } = useStyles();
    return (
      <div
        className={cx(
          styles.fileHeader,
          'file-header',
          'flex w-full items-center space-x-1.5 overflow-hidden px-2.5'
        )}>
        <Text className="truncate">{file_name}</Text>
        <VersionPill version_number={version_number} />
      </div>
    );
  });

ChatResponseMessageHeader.displayName = 'ChatResponseMessageHeader';

const ChatResponseMessageBody: React.FC<{
  metadata: BusterChatMessage_fileMetadata[];
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

const MetadataItem: React.FC<{ metadata: BusterChatMessage_fileMetadata }> = ({ metadata }) => {
  const { cx, styles } = useStyles();
  const { status, message, timestamp } = metadata;

  const timestampFormatted = useMemo(() => {
    if (!timestamp) return '';
    return `${timestamp} seconds`;
  }, [timestamp]);

  return (
    <div
      className={cx(
        styles.hideSecondaryText,
        'flex w-full items-center justify-start space-x-1.5 overflow-hidden'
      )}>
      <div>
        <StatusIndicator status={status} />
      </div>

      <Text className="truncate" size="xs" type="secondary">
        {message}
      </Text>

      {timestamp && (
        <Text type="tertiary" className="secondary-text whitespace-nowrap" size="xs">
          {timestampFormatted}
        </Text>
      )}
    </div>
  );
};

const useStyles = createStyles(({ token, css }) => ({
  fileContainer: css`
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};

    &:hover {
      border-color: ${token.colorTextTertiary};
      box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.15);
    }

    &.selected {
      border-color: black;
      box-shadow: 0px 0px 5.5px 0px rgba(0, 0, 0, 0.15);
    }
  `,
  fileHeader: css`
    background: ${token.controlItemBgActive};
    border-bottom: 0.5px solid ${token.colorBorder};
    height: 32px;
  `,
  hideSecondaryText: css`
    container-type: inline-size;
    @container (max-width: 190px) {
      .secondary-text {
        display: none;
      }
    }
  `
}));
