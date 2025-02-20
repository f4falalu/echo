import { BusterChatMessageReasoning_status } from '@/api/asset_interfaces';
import { StatusIndicator } from '@/components/ui/indicators';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { itemAnimationConfig } from './animationConfig';
import { Text } from '@/components/text';

export const BarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isCompletedStream: boolean;
  children: React.ReactNode;
  title: string;
  secondaryTitle?: string;
  contentClassName?: string;
}> = React.memo(
  ({ showBar, status, isCompletedStream, children, title, secondaryTitle, contentClassName }) => {
    return (
      <AnimatePresence initial={!isCompletedStream}>
        <motion.div
          className={'relative flex space-x-1.5 overflow-hidden'}
          {...itemAnimationConfig}>
          <VerticalBarContainer showBar={showBar} status={status} />

          <div className={`flex w-full flex-col space-y-2 overflow-hidden ${contentClassName}`}>
            <TextContainer title={title} secondaryTitle={secondaryTitle} />
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

BarContainer.displayName = 'BarContainer';

const VerticalBarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
}> = React.memo(({ showBar, status }) => {
  return (
    <div className="ml-2 flex w-4 min-w-4 flex-col items-center">
      <StatusIndicator status={status} />
      <VerticalBar show={showBar} />
    </div>
  );
});

VerticalBarContainer.displayName = 'BarContainer';

const VerticalBar: React.FC<{ show?: boolean }> = ({ show }) => {
  const { styles, cx } = useStyles();
  return (
    <div
      className={cx(
        'flex w-full flex-1 items-center justify-center overflow-hidden',
        'opacity-0 transition-opacity duration-300',
        show && 'opacity-100!'
      )}>
      <div className={cx(styles.verticalBar, 'mt-1 overflow-hidden')} />
    </div>
  );
};

const lineHeight = 13;

const TextContainer: React.FC<{
  title: string;
  secondaryTitle?: string;
}> = React.memo(({ title, secondaryTitle }) => {
  const { styles, cx } = useStyles();

  return (
    <div
      className={cx(
        styles.hideSecondaryText,
        'flex w-full items-center space-x-1.5 overflow-hidden'
      )}>
      <AnimatedThoughtTitle title={title} type="default" />
      <AnimatedThoughtTitle
        title={secondaryTitle}
        type="tertiary"
        className="secondary-text truncate"
      />
    </div>
  );
});

TextContainer.displayName = 'TextContainer';

const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const AnimatedThoughtTitle = React.memo(
  ({
    title,
    type,
    className = ''
  }: {
    title: string | undefined;
    type: 'tertiary' | 'default';
    className?: string;
  }) => {
    return (
      <AnimatePresence initial={false} mode="wait">
        {title && (
          <motion.div className="flex" {...animations} key={title}>
            <Text
              size="sm"
              className={`whitespace-nowrap ${className}`}
              type={type}
              lineHeight={lineHeight}>
              {title}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AnimatedThoughtTitle.displayName = 'AnimatedThoughtTitle';

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    position: relative;
  `,
  verticalBar: css`
    width: 0.5px;
    height: 100%;
    background-color: ${token.colorTextPlaceholder};
  `,
  hideSecondaryText: css`
    container-type: inline-size;
    @container (max-width: 170px) {
      .secondary-text {
        display: none;
      }
    }
  `
}));
