import { PopupContainer, PopupSplitter } from '@/components/ui/popup';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { Command, ReturnKey, TriangleWarning } from '@/components/ui/icons';

export const SaveResetFilePopup: React.FC<{
  open: boolean;
  onReset: () => void;
  onSave: () => void;
}> = React.memo(({ open, onReset, onSave }) => {
  return (
    <PopupContainer show={open}>
      <SplitterContent onReset={onReset} onSave={onSave} />
    </PopupContainer>
  );
});

const SplitterContent: React.FC<{
  onReset: () => void;
  onSave: () => void;
}> = React.memo(({ onReset, onSave }) => {
  return (
    <div className="flex w-full items-center space-x-2.5">
      <div className="flex items-center space-x-1">
        <TriangleWarning />
        <Text>Unsaved changes</Text>
      </div>

      <PopupSplitter />

      <div className="flex items-center space-x-2">
        <Button onClick={onReset}>Reset</Button>
        <Button
          className="flex items-center"
          variant="black"
          onClick={onSave}
          suffix={
            <div className="flex space-x-1">
              <Command />
              <ReturnKey />
            </div>
          }>
          Save
        </Button>
      </div>
    </div>
  );
});

SaveResetFilePopup.displayName = 'SaveResetFilePopup';

SplitterContent.displayName = 'SplitterContent';
