import { BusterChatMessageReasoning_status } from '@/api/asset_interfaces';
import { StatusIndicator } from '@/components/ui/indicators';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { itemAnimationConfig } from './animationConfig';

export const BarContainer: React.FC<{
  showBar: boolean;
  status: BusterChatMessageReasoning_status;
  isCompletedStream: boolean;
  children?: React.ReactNode;
  title: string;
  secondaryTitle?: string;
}> = React.memo(({ showBar, status, children, title, secondaryTitle }) => {
  return (
    <div className={'relative flex space-x-1.5 overflow-hidden'}>
      <VerticalBarContainer showBar={showBar} status={status} />

      <div className={`mb-2 flex w-full flex-col space-y-2 overflow-hidden`}>
        <TitleContainer title={title} secondaryTitle={secondaryTitle} />
        {children}
      </div>
    </div>
  );
});

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
        'flex w-full flex-1 justify-center overflow-hidden',
        'opacity-0 transition-opacity duration-300',
        show && 'opacity-100!'
      )}>
      <motion.div
        className={cn('bg-text-tertiary w-[0.5px]', 'mt-1 overflow-hidden')}
        initial={{ height: 0 }}
        animate={{ height: '100%' }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
};

const TitleContainer: React.FC<{
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

TitleContainer.displayName = 'TitleContainer';

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
          <motion.div className="flex" {...itemAnimationConfig} key={title}>
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
