import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { AppModal } from '@/components/ui/modal';
import { useUserConfigContextSelector } from '@/context/Users';
import { TagInput } from '@/components/ui/inputs/InputTagInput';

export const InvitePeopleModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const [emails, setEmails] = React.useState<string[]>([]);
  const [inviting, setInviting] = React.useState<boolean>(false);
  const inviteUsers = useUserConfigContextSelector((state) => state.inviteUsers);
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);

  const handleInvite = useMemoizedFn(async () => {
    setInviting(true);
    await inviteUsers(emails);
    setInviting(false);
    onClose();
  });

  const onCloseEmail = useMemoizedFn((email: string) => {
    setEmails(emails.filter((e) => e !== email));
  });

  const memoizedHeader = useMemo(() => {
    return {
      title: 'Invite others to join your workspace',
      description: `You can share the link below with others you’d like to join your workspace. You can also input their email to send them an invite.`
    };
  }, []);

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Send invites',
        onClick: handleInvite,
        loading: inviting,
        disabled: emails.length === 0
      }
    };
  }, [inviting, emails.length]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <div className="flex flex-col">
        <TagInput
          value={emails}
          onTagAdd={(v) => {
            setEmails([...emails, v]);
          }}
          onTagRemove={(index) => {
            setEmails(emails.filter((_, i) => i !== index));
          }}
          placeholder="buster@bluthbananas.com, tobias@bluthbananas.com..."
        />
      </div>
    </AppModal>
  );
});

InvitePeopleModal.displayName = 'InvitePeopleModal';
