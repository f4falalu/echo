import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { cn } from '@/lib/classMerge';

export const KeyboardShortcutPill = ({ shortcut }: { shortcut?: string[] }) => {
  if (isEmpty(shortcut)) {
    return null;
  }

  return (
    <div className="flex space-x-0.5">
      {shortcut?.map((s) => (
        <TooltipShortcut key={s} shortcut={s} />
      ))}
    </div>
  );
};

KeyboardShortcutPill.displayName = 'KeyboardShortcutPill';

const TooltipShortcut: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  const numberOfChars = shortcut.length;

  return (
    <div
      className={cn(
        'bg-background text-gray-light pointer-events-none relative flex items-center justify-center rounded border border-gray-300 text-xs leading-none',
        numberOfChars === 1 ? 'w-4 h-4' : 'h-4 px-1 min-w-1.5'
      )}
      style={{ lineHeight: '1' }}
    >
      {shortcut}
    </div>
  );
};
