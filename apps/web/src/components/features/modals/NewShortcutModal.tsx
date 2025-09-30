import React, { useState } from 'react';
import { useCreateShortcut } from '@/api/buster_rest/shortcuts/queryRequests';
import { Input } from '@/components/ui/inputs';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { AppModal } from '@/components/ui/modal';
import { Text } from '@/components/ui/typography/Text';
import { inputHasText } from '@/lib/text';

export const NewShortcutModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const { mutateAsync: createShortcut, isPending: isCreatingShortcut } = useCreateShortcut();
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');

  const disableSubmit = !inputHasText(name) || !inputHasText(instructions);

  const resetModal = () => {
    setName('');
    setInstructions('');
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      header={{
        title: 'Create a shortcut',
        description: 'Use shortcuts for your repeatable workflows in Buster.',
      }}
      footer={{
        primaryButton: {
          loading: isCreatingShortcut,
          text: 'Create shortcut',
          onClick: async () => {
            if (disableSubmit) return;
            await createShortcut({ name, instructions, shareWithWorkspace: false });
            onClose();
            setTimeout(() => {
              resetModal();
            }, 350);
          },
          disabled: disableSubmit,
        },
      }}
    >
      <StyleContainer title="Shortcut name">
        <Input
          placeholder="name"
          prefix="/"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </StyleContainer>
      <StyleContainer title="Shortcut description">
        <InputTextArea
          placeholder="Instructions that Buster should follow when you use this shortcut..."
          minRows={4}
          maxRows={8}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </StyleContainer>
    </AppModal>
  );
});

const StyleContainer = ({ children, title }: { children: React.ReactNode; title: string }) => {
  return (
    <div className="p-0 flex flex-col space-y-1 w-full">
      <Text size={'xs'} variant={'secondary'}>
        {title}
      </Text>
      {children}
    </div>
  );
};
