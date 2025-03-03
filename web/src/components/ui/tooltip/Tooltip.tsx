import React from 'react';
import {
  Tooltip as TooltipBase,
  TooltipContent as TooltipContentBase,
  TooltipProvider,
  TooltipTrigger
} from './TooltipBase';
import { KeyboardShortcutPill } from '../pills/KeyboardShortcutPills';
import omit from 'lodash/omit';

export interface TooltipProps
  extends Pick<React.ComponentProps<typeof TooltipContentBase>, 'align' | 'side' | 'sideOffset'>,
    Pick<React.ComponentProps<typeof TooltipProvider>, 'delayDuration' | 'skipDelayDuration'> {
  children: React.ReactNode;
  title: string | undefined;
  shortcuts?: string[];
  open?: boolean;
}

export const Tooltip = React.memo<TooltipProps>(
  ({
    children,
    title,
    sideOffset,
    shortcuts,
    delayDuration = 0,
    skipDelayDuration,
    align,
    side,
    open
  }) => {
    if (!title || (!title && !shortcuts?.length)) return children;

    return (
      <TooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
        <TooltipBase open={open}>
          <TooltipTrigger asChild>
            <span className="inline-block">{children}</span>
          </TooltipTrigger>
          <TooltipContentBase align={align} side={side} sideOffset={sideOffset}>
            <TooltipContent title={title} shortcut={shortcuts} />
          </TooltipContentBase>
        </TooltipBase>
      </TooltipProvider>
    );
  },
  (prevProps, nextProps) => {
    return omit(prevProps, 'shortcut') === omit(nextProps, 'shortcut');
  }
);

const TooltipContent: React.FC<{
  title: string;
  shortcut?: string[];
}> = ({ title, shortcut }) => {
  return (
    <div className="flex h-3 max-h-3 min-h-3 items-center gap-x-1">
      <span className="text-sm">{title}</span>
      <KeyboardShortcutPill shortcut={shortcut} />
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
