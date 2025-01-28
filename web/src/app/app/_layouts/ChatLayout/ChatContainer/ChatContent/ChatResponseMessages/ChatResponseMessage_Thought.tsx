import {
  BusterChatMessage_thought,
  BusterChatMessage_thoughtPill
} from '@/api/buster_socket/chats';
import React, { useState } from 'react';
import { ChatResponseMessageProps } from './ChatResponseMessages';
import { AnimatePresence, motion } from 'framer-motion';
import { animationConfig } from './animationConfig';
import { CircleSpinnerLoader } from '@/components/loaders/CircleSpinnerLoader';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { AppMaterialIcons } from '@/components';
import { useHotkeys } from 'react-hotkeys-hook';
import { faker } from '@faker-js/faker';
import { PillContainer } from './ChatResponseMessage_ThoughtPills';

export const ChatResponseMessage_Thought: React.FC<ChatResponseMessageProps> = React.memo(
  ({ responseMessage: responseMessageProp, isCompletedStream }) => {
    const responseMessage = responseMessageProp as BusterChatMessage_thought;
    const { thought_title, thought_secondary_title, thought_pills, in_progress } = responseMessage;
    const { styles, cx } = useStyles();
    const hasPills = thought_pills && thought_pills.length > 0;

    const [myPills, setMyPills] = useState(thought_pills || []);

    useHotkeys('j', () => {
      const fourRandomPills: BusterChatMessage_thoughtPill[] = Array.from({ length: 5 }, () => {
        return {
          text: faker.lorem.word(),
          type: 'term',
          id: faker.string.uuid()
        };
      });
      setMyPills(fourRandomPills);
    });

    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div className={cx(styles.container, 'flex space-x-1.5')} {...animationConfig}>
          <div className="flex w-4 flex-col items-center pt-0.5">
            <StatusIndicator inProgress={in_progress} />
            <VerticalBar inProgress={in_progress} hasPills={hasPills} />
          </div>
          <div className="flex w-full flex-col space-y-2">
            <div className="flex w-full items-center space-x-1.5 overflow-hidden">
              <Text size="sm" className="truncate">
                {thought_title}
              </Text>
              <Text size="sm" type="tertiary">
                {thought_secondary_title}
              </Text>
            </div>

            <PillContainer pills={myPills} />
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

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    position: relative;
  `,
  verticalBar: css`
    width: 0.5px;
    height: 100%;
    background-color: ${token.colorTextPlaceholder};
  `,
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
