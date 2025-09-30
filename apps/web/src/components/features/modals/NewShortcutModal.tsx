import React from 'react';
import { AppModal } from '@/components/ui/modal';

export const NewShortcutModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      header={{ title: 'New shortcut' }}
      footer={{
        primaryButton: {
          text: 'Create shortcut',
          onClick: () => {},
        },
      }}
    >
      asdf{' '}
    </AppModal>
  );
});
