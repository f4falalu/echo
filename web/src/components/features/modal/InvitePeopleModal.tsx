import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { AppModal } from '@/components/ui/modal';
import { InputTagInput } from '@/components/ui/inputs/InputTagInput';
import { useInviteUser } from '@/api/buster_rest/users';
import { validate } from 'email-validator';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const InvitePeopleModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const [emails, setEmails] = React.useState<string[]>([]);
  const { mutateAsync: inviteUsers, isPending: inviting } = useInviteUser();
  const { openErrorMessage } = useBusterNotifications();

  const handleInvite = useMemoizedFn(async () => {
    await inviteUsers({ emails });
    onClose();
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
        <InputTagInput
          tags={emails}
          onTagAdd={(v) => {
            if (validate(v)) {
              setEmails([...emails, v]);
            } else {
              openErrorMessage(`Invalid email - ${v}`);
            }
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
