import React, { useMemo } from 'react';
import { ChatResponseMessageProps } from '../ChatResponseMessages';
import { createStyles } from 'antd-style';
import type {
  BusterChatMessage_file,
  BusterChatMessage_fileMetadata
} from '@/api/buster_socket/chats';
import { Text } from '@/components/text';
import { motion, AnimatePresence } from 'framer-motion';
import { animationConfig } from '../animationConfig';
import { useMemoizedFn } from 'ahooks';
import { StatusIndicator } from '../StatusIndicator';
import { formatDate } from '@/utils';

export const ChatResponseMessage_File: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream }) => {
    const { cx, styles } = useStyles();
    const responseMessage = responseMessageProp as BusterChatMessage_file;
    const { file_name, file_type, version_id, version_number, id, metadata = [] } = responseMessage;

    const onClickCard = useMemoizedFn(() => {
      console.log('clicked');
    });

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div
          id={id}
          {...animationConfig}
          className={cx(styles.fileCard, 'file-card flex flex-col overflow-hidden')}>
          <VerticalDivider className="top-line mb-0.5" />
          <div
            onClick={onClickCard}
            className={cx(
              styles.fileContainer,
              'transition-shadow duration-300',
              'flex flex-col items-center',
              'cursor-pointer overflow-hidden'
            )}>
            <ChatResponseMessageHeader file_name={file_name} version_number={version_number} />
            <ChatResponseMessageBody metadata={metadata} />
          </div>
          <VerticalDivider className="bottom-line mt-0.5" />
        </motion.div>
      </AnimatePresence>
    );
  }
);

ChatResponseMessage_File.displayName = 'ChatResponseMessage_File';

const ChatResponseMessageHeader: React.FC<{ file_name: string; version_number: number }> = ({
  file_name,
  version_number
}) => {
  const { cx, styles } = useStyles();
  return (
    <div
      className={cx(
        styles.fileHeader,
        'file-header',
        'flex w-full items-center space-x-1.5 overflow-hidden px-2.5'
      )}>
      <Text className="truncate">{file_name}</Text>
      <div className={cx(styles.fileVersion, 'flex items-center space-x-1.5')}>
        <Text type="secondary" lineHeight={11} size="sm">
          v{version_number}
        </Text>
      </div>
    </div>
  );
};

const ChatResponseMessageBody: React.FC<{
  metadata: BusterChatMessage_fileMetadata[];
}> = ({ metadata }) => {
  return (
    <div className="flex w-full flex-col items-center space-y-0.5 px-2.5 py-2">
      {metadata.map((metadata, index) => (
        <MetadataItem metadata={metadata} key={index} />
      ))}
    </div>
  );
};

const MetadataItem: React.FC<{ metadata: BusterChatMessage_fileMetadata }> = ({ metadata }) => {
  const { status, message, timestamp } = metadata;

  const timestampFormatted = useMemo(() => {
    if (!timestamp) return '';
    return formatDate({
      date: timestamp,
      format: 'll'
    });
  }, [timestamp]);

  return (
    <div className="flex w-full items-center justify-start space-x-1.5 overflow-hidden">
      <div>
        <StatusIndicator status={status} />
      </div>

      <Text className="truncate" size="xs" type="secondary">
        {message}
      </Text>

      {timestamp && (
        <Text type="tertiary" className="truncate" size="xs">
          {timestampFormatted}
        </Text>
      )}
    </div>
  );
};

const VerticalDivider: React.FC<{ className?: string }> = ({ className }) => {
  const { cx, styles } = useStyles();
  return <div className={cx(styles.verticalDivider, 'vertical-divider', className)} />;
};

const useStyles = createStyles(({ token, css }) => ({
  fileCard: css`
    & + .file-card {
      .vertical-divider.top-line {
        display: none;
      }
    }

    &.file-card {
      .thought-card + & {
        .vertical-divider.top-line {
          display: none;
        }
      }
    }

    &:last-child {
      .vertical-divider.bottom-line {
        display: none;
      }
    }
  `,
  fileContainer: css`
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};

    &:hover {
      border-color: ${token.colorTextTertiary};
      box-shadow: ${token.boxShadowTertiary};
    }

    &.selected {
      border-color: black;
      box-shadow: ${token.boxShadowTertiary};
    }
  `,
  fileHeader: css`
    background: ${token.controlItemBgActive};
    border-bottom: 0.5px solid ${token.colorBorder};
    height: 32px;
  `,
  fileVersion: css`
    border-radius: ${token.borderRadius}px;
    padding: 4px;
    background: ${token.colorFillTertiary};
  `,
  verticalDivider: css`
    height: 9px;
    width: 0.5px;
    margin-left: 8px;
    background: ${token.colorTextTertiary};
  `
}));
