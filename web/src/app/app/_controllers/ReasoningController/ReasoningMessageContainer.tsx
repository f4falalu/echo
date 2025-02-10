import type { BusterChatMessageReasoning } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { ReasoningMessageSelector } from './ReasoningMessages';
import { createStyles } from 'antd-style';

export const ReasoningMessageContainer: React.FC<{
  reasoningMessages: BusterChatMessageReasoning[];
  isCompletedStream: boolean;
}> = React.memo(({ reasoningMessages, isCompletedStream }) => {
  const { cx, styles } = useStyles();
  const lastMessageIndex = reasoningMessages.length - 1;

  const typeClassRecord: Record<BusterChatMessageReasoning['type'], string> = useMemo(() => {
    return {
      text: cx(styles.textCard, 'text-card'),
      thought: cx(styles.thoughtCard, 'thought-card'),
      file: cx(styles.fileCard, 'file-card')
    };
  }, []);

  const getContainerClass = (item: BusterChatMessageReasoning) => {
    return typeClassRecord[item.type];
  };

  return (
    <div className="flex flex-col pb-4">
      {reasoningMessages?.map((message, index) => (
        <div key={message.id} className={getContainerClass(message)}>
          <ReasoningMessageSelector
            key={message.id}
            reasoningMessage={message}
            isCompletedStream={isCompletedStream}
            isLastMessageItem={index === lastMessageIndex}
          />
          <VerticalDivider />
        </div>
      ))}
    </div>
  );
});

ReasoningMessageContainer.displayName = 'ReasoningMessageContainer';

const VerticalDivider: React.FC<{ className?: string }> = React.memo(({ className }) => {
  const { cx, styles } = useStyles();
  return <div className={cx(styles.verticalDivider, 'vertical-divider', className)} />;
});
VerticalDivider.displayName = 'VerticalDivider';

const useStyles = createStyles(({ token, css }) => ({
  textCard: css`
    margin-bottom: 14px;

    &:has(+ .text-card) {
      margin-bottom: 8px;
    }

    .vertical-divider {
      display: none;
    }
  `,
  thoughtCard: css`
    .vertical-divider {
      display: none;
    }

    margin-bottom: 4px;
  `,
  fileCard: css`
    margin-bottom: 4px;

    .vertical-divider {
      display: none;
    }
  `,
  verticalDivider: css`
    transition: opacity 0.2s ease-in-out;
    height: 9px;
    width: 0.5px;
    margin: 3px 0 3px 16px;
    background: ${token.colorTextTertiary};
  `
}));
