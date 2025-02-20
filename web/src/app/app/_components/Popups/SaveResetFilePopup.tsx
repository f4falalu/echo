import { PopupContainer, PopupSplitter } from '@/components/ui/popup';
import React from 'react';
import { Text } from '@/components/ui';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/ui';
import { createStyles } from 'antd-style';

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
  const { styles, cx } = useStyles();

  return (
    <div className="flex w-full items-center space-x-2.5">
      <div className="flex items-center space-x-1">
        <AppMaterialIcons className={styles.icon} icon="warning" />
        <Text>Unsaved changes</Text>
      </div>

      <PopupSplitter />

      <div className="flex items-center space-x-2">
        <Button type="default" onClick={onReset}>
          Reset
        </Button>
        <Button className="flex items-center" color="default" variant="solid" onClick={onSave}>
          <span>Save</span>
          <AppMaterialIcons icon="keyboard_command_key" />
          <AppMaterialIcons icon="keyboard_return" />
        </Button>
      </div>
    </div>
  );
});

SaveResetFilePopup.displayName = 'SaveResetFilePopup';
SplitterContent.displayName = 'SplitterContent';
const useStyles = createStyles(({ css, token }) => ({
  icon: css`
    color: ${token.colorIcon};
  `
}));
