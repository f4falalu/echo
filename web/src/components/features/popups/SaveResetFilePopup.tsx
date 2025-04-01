import { PopupContainer, PopupSplitter } from '@/components/ui/popup';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { Command, ReturnKey, TriangleWarning } from '@/components/ui/icons';
import { PreventNavigation } from '@/components/ui/layouts/PreventNavigation';

export const SaveResetFilePopup: React.FC<{
  open: boolean;
  onReset: () => void;
  onSave: () => void;
  isSaving?: boolean;
}> = React.memo(({ open, onReset, onSave, isSaving = false }) => {
  return (
    <PopupContainer show={open}>
      <SplitterContent onReset={onReset} onSave={onSave} isSaving={isSaving} open={open} />
    </PopupContainer>
  );
});

const SplitterContent: React.FC<{
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
  open: boolean;
}> = React.memo(({ onReset, onSave, isSaving, open }) => {
  return (
    <React.Fragment>
      <div className="flex w-full items-center space-x-2.5">
        <div className="flex items-center space-x-1">
          <TriangleWarning />
          <Text>Unsaved changes</Text>
        </div>

        <PopupSplitter />

        <div className="flex items-center space-x-2">
          <Button variant={'default'} onClick={onReset}>
            Reset
          </Button>
          <Button
            className="flex items-center"
            variant="black"
            onClick={onSave}
            loading={isSaving}
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

      <PreventNavigation
        title="Unsaved changes"
        isDirty={open}
        description="Are you sure you want to leave this page?"
        onOk={() => {
          onSave();
          return Promise.resolve();
        }}
        onCancel={() => {
          onReset();
          return Promise.resolve();
        }}
      />
    </React.Fragment>
  );
});

SaveResetFilePopup.displayName = 'SaveResetFilePopup';

SplitterContent.displayName = 'SplitterContent';
