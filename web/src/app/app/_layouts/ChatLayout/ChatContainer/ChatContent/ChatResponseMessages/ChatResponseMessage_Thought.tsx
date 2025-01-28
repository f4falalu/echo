import { BusterChatMessage_thought } from '@/api/buster_socket/chats';
import React, { useMemo } from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessages';
import { AnimatePresence, motion } from 'framer-motion';
import { animationConfig } from './animationConfig';
import { CircleSpinnerLoader } from '@/components/loaders/CircleSpinnerLoader';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { AppMaterialIcons } from '@/components';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_thought;
    const { thought_title, thought_secondary_title, thought_pills, in_progress } = responseMessage;
    const { styles, cx } = useStyles();
    const hasPills = thought_pills && thought_pills.length > 0;

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div className={cx(styles.container, 'flex space-x-1.5')} {...animationConfig}>
          <div className="flex w-4 flex-col items-center pt-0.5">
            <StatusIndicator inProgress={in_progress} />
            <VerticalBar inProgress={in_progress} hasPills={hasPills} />
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-1.5">
              <Text size="sm">{thought_title}</Text>
              <Text size="sm" type="tertiary">
                {thought_secondary_title}
              </Text>
            </div>

            <PillContainer pills={thought_pills} />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

ChatResponseMessage_Thought.displayName = 'ChatResponseMessage_Thought';

const StatusIndicator: React.FC<{ inProgress?: boolean }> = ({ inProgress }) => {
  const { styles, cx } = useStyles();
  return (
    <div
      className={cx(
        styles.indicatorContainer,
        inProgress && 'in-progress',
        'flex items-center justify-center'
      )}>
      <div
        className={cx(
          styles.indicator,
          inProgress && 'in-progress',
          'flex items-center justify-center'
        )}>
        {inProgress ? (
          <CircleSpinnerLoader size={8} />
        ) : (
          <AppMaterialIcons className="" icon="check" size={6} />
        )}
      </div>
    </div>
  );
};

const VerticalBar: React.FC<{ inProgress?: boolean; hasPills?: boolean }> = ({
  inProgress,
  hasPills
}) => {
  const { styles, cx } = useStyles();
  return (
    <div
      className={cx(
        'flex w-full flex-1 items-center justify-center overflow-hidden',
        // 'opacity-0',
        'transition-opacity duration-300',
        hasPills && 'opacity-100'
      )}>
      <div className={cx(styles.verticalBar, 'mt-1 overflow-hidden')} />
    </div>
  );
};

const PillContainer: React.FC<{ pills: BusterChatMessage_thought['thought_pills'] }> = ({
  pills
}) => {
  const { styles, cx } = useStyles();

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: 'auto' }}
      exit={{ height: 0 }}
      className={cx(styles.pillContainer, 'min-h-0.5')}></motion.div>
  );
};

const ThoughtPill: React.FC<{
  pill: NonNullable<BusterChatMessage_thought['thought_pills']>[number];
}> = ({ pill }) => {
  const { styles, cx } = useStyles();
  return <div className={cx(styles.pill, '')}></div>;
};

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    position: relative;
  `,
  verticalBar: css`
    width: 0.5px;
    height: 100%;
    background-color: ${token.colorTextPlaceholder};
  `,
  pillContainer: css``,
  pill: {
    backgroundColor: token.controlItemBgActive,
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: token.borderRadiusLG,
    padding: '2px 8px'
  },
  indicatorContainer: css`
    width: 10px;
    height: 10px;
    background-color: ${token.colorTextPlaceholder};
    border-radius: 100%;

    &.in-progress {
      background-color: transparent;
  `,
  indicator: css`
    color: white;
    padding: 1px;
    border-radius: 100%;
    background-color: ${token.colorTextPlaceholder};
    box-shadow: 0 0 0 0.7px white inset;

    &.in-progress {
      background-color: transparent;
      box-shadow: none;
    }
  `
}));
