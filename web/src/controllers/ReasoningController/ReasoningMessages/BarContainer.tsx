import { BusterChatMessageReasoning_status } from '@/api/asset_interfaces';
import { StatusIndicator } from '@/components/ui/indicators';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { itemAnimationConfig } from './animationConfig';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

export const BarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isCompletedStream: boolean;
  children?: React.ReactNode;
  title: string;
  secondaryTitle?: string;
  contentClassName?: string;
  animationKey?: string;
}> = React.memo(
  ({
    showBar,
    status,
    isCompletedStream,
    children,
    title,
    secondaryTitle,
    contentClassName,
    animationKey
  }) => {
    return (
      <AnimatePresence initial={!isCompletedStream} mode="wait">
        <motion.div
          className={'relative flex space-x-1.5 overflow-hidden'}
          {...itemAnimationConfig}
          key={animationKey}>
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
    <div className="ml-2 flex w-5 min-w-5 flex-col items-center">
      <StatusIndicator status={status} />
      <VerticalBar show={showBar} />
    </div>
  );
});

VerticalBarContainer.displayName = 'BarContainer';

const VerticalBar: React.FC<{ show?: boolean }> = ({ show }) => {
  return (
    <div
      className={cn(
        'flex w-full flex-1 items-center justify-center overflow-hidden',
        'opacity-0 transition-opacity duration-300',
        show && 'opacity-100!'
      )}>
      <motion.div
        className={cn('bg-text-tertiary w-[0.5px]', 'mt-1 overflow-hidden')}
        initial={{ height: 0 }}
        animate={{ height: '100%' }}
        transition={{
          duration: 0.3,
          ease: 'easeOut'
        }}
      />
    </div>
  );
};

const lineHeight = 13;

const TextContainer: React.FC<{
  title: string;
  secondaryTitle?: string;
}> = React.memo(({ title, secondaryTitle }) => {
  return (
    <div className={cn('@container', 'flex w-full items-center space-x-1.5 overflow-hidden')}>
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
    const isSecondaryTitle = type === 'tertiary';
    return (
      <AnimatePresence initial={false} mode="wait">
        {title && (
          <motion.div className="flex" {...animations} key={title}>
            <Text
              size="sm"
              className={cn(
                `whitespace-nowrap`,
                isSecondaryTitle ? '@[170px]:hidden' : '',
                className
              )}
              variant={type}>
              {title}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AnimatedThoughtTitle.displayName = 'AnimatedThoughtTitle';
