import React from 'react';
import isEmpty from 'lodash/isEmpty';

export const KeyboardShortcutPill: React.FC<{
  shortcut?: string[];
}> = ({ shortcut }) => {
  if (isEmpty(shortcut)) {
    return null;
  }

  return (
    <div className="flex space-x-0.5">
      {shortcut?.map((s, i) => <TooltipShortcut key={i} shortcut={s} />)}
    </div>
  );
};

KeyboardShortcutPill.displayName = 'KeyboardShortcutPill';

const TooltipShortcut: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  return (
    <div className="border-border bg-background text2xs pointer-events-none relative flex h-5 w-[1.375rem] items-center justify-center rounded border-[0.5px] leading-none shadow">
      {shortcut}
    </div>
  );
};
