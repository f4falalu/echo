import React from 'react';
import { Magnifier, Sparkle2 } from '@/components/ui/icons';
import Atom from '@/components/ui/icons/NucleoIconOutlined/atom';
import { AppSegmented, type AppSegmentedProps } from '@/components/ui/segmented';

export type BusterChatInputMode = 'auto' | 'research' | 'deep-research';

type BusterChatInputButtons = {
  onSubmit: () => void;
  onStop: () => void;
  submitting: boolean;
  disabled: boolean;
  mode: BusterChatInputMode;
  onModeChange: (mode: BusterChatInputMode) => void;
};

const modesOptions: AppSegmentedProps<BusterChatInputMode>['options'] = [
  { icon: <Sparkle2 />, value: 'auto' },
  { icon: <Magnifier />, value: 'research' },
  { icon: <Atom />, value: 'deep-research' },
];

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
