import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { AppModal } from '@/components/ui/modal';
import { TagInput } from '@/components/ui/inputs/InputTagInput';
import { useInviteUser } from '@/api/buster_rest/users';

export const InvitePeopleModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const [emails, setEmails] = React.useState<string[]>([]);
  const { mutateAsync: inviteUsers, isPending: inviting } = useInviteUser();

  const handleInvite = useMemoizedFn(async () => {
    await inviteUsers({ emails });
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
