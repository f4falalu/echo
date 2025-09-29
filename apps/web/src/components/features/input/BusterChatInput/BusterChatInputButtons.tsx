import React from 'react';
import { Magnifier, Sparkle2 } from '@/components/ui/icons';
import Atom from '@/components/ui/icons/NucleoIconOutlined/atom';
import { Popover } from '@/components/ui/popover';
import { AppSegmented, type AppSegmentedProps } from '@/components/ui/segmented';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export type BusterChatInputMode = 'auto' | 'research' | 'deep-research';

type BusterChatInputButtons = {
  onSubmit: () => void;
  onStop: () => void;
  submitting: boolean;
  disabled: boolean;
  mode: BusterChatInputMode;
  onModeChange: (mode: BusterChatInputMode) => void;
};

export const BusterChatInputButtons = ({
  onSubmit,
  onStop,
  submitting,
  disabled,
  mode,
  onModeChange,
}: BusterChatInputButtons) => {
  return (
    <div className="flex justify-between items-center gap-2">
      <AppSegmented value={mode} options={modesOptions} onChange={(v) => onModeChange(v.value)} />
    </div>
  );
};

const ModePopoverContent = ({
  title,
  description,
  icon,
  iconText,
  content,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconText: string;
  content: string;
  children: React.ReactNode;
}) => {
  const classes = 'px-3';
  return (
    <Popover
      trigger="hover"
      side="bottom"
      sideOffset={10}
      className="p-0"
      content={
        <div className={cn('flex flex-col space-y-3 max-w-[210px] py-3')}>
          <div className={cn('flex flex-col space-y-1', classes)}>
            <Text>{title}</Text>
            <Text variant="secondary">{description}</Text>
          </div>
          <div className="border-t" />
          <div className={cn('flex flex-col space-y-1', classes)}>
            <div className="flex items-center gap-1 bg-item-select rounded px-1 h-4.5 w-fit text-sm text-gray-dark">
              {icon}
              <Text variant={'secondary'} size={'sm'}>
                {iconText}
              </Text>
            </div>
            <Text variant="secondary">{content}</Text>
          </div>
        </div>
      }
    >
      {children}
    </Popover>
  );
};

const modesOptions: AppSegmentedProps<BusterChatInputMode>['options'] = [
  {
    icon: (
      <ModePopoverContent
        title="Auto"
        description="Decides how long to think"
        icon={<Sparkle2 />}
        iconText="Auto Mode"
        content={`Dynamically pick between “Research” and “Deep Research”`}
      >
        <Sparkle2 />
      </ModePopoverContent>
    ),
    value: 'auto' as const,
  },
  {
    icon: (
      <ModePopoverContent
        title="Research"
        description="Responds in 1-3 minutes"
        icon={<Magnifier />}
        iconText="Research Mode"
        content={`In-depth exploration for ad-hoc charts, dashboards, or reports`}
      >
        <Magnifier />
      </ModePopoverContent>
    ),
    value: 'research' as const,
  },
  {
    icon: (
      <ModePopoverContent
        title="Deep Research"
        description="Responds in 3-8 minutes"
        icon={<Atom />}
        iconText="Deep Research Mode"
        content={`Generate robust reports with extremely thorough analysis`}
      >
        <Atom />
      </ModePopoverContent>
    ),
    value: 'deep-research' as const,
  },
];
