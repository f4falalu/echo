import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/buttons';
import { Command, ReturnKey, TriangleWarning } from '@/components/ui/icons';
import { PreventNavigation } from '@/components/ui/layouts/PreventNavigation';
import { PopupContainer, PopupSplitter } from '@/components/ui/popup';
import { Text } from '@/components/ui/typography';

export type SaveResetFilePopupProps = {
  open: boolean;
  onReset: () => void;
  onSave: () => void;
  isSaving?: boolean;
  className?: string;
  showHotsKeys?: boolean;
};

export const SaveResetFilePopup: React.FC<SaveResetFilePopupProps> = React.memo(
  ({ open, onReset, onSave, isSaving = false, className = '', showHotsKeys = false }) => {
    return (
      <PopupContainer show={open} className={className}>
        <SplitterContent
          onReset={onReset}
          onSave={onSave}
          isSaving={isSaving}
          open={open}
          showHotsKeys={showHotsKeys}
        />
      </PopupContainer>
    );
  }
);

const SplitterContent: React.FC<{
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  open: boolean;
  showHotsKeys: boolean;
}> = React.memo(({ onReset, onSave, isSaving, open, showHotsKeys = false }) => {
  useHotkeys('meta+enter', () => onSave(), {
    enabled: showHotsKeys && open && !isSaving,
    preventDefault: true,
  });

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
          loading={isSaving}
          suffix={
            showHotsKeys && (
              <div className="flex space-x-1">
                <Command />
                <ReturnKey />
              </div>
            )
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
});

SaveResetFilePopup.displayName = 'SaveResetFilePopup';

SplitterContent.displayName = 'SplitterContent';
