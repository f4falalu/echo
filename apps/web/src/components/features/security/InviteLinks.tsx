'use client';

import React from 'react';
import { SecurityCards } from './SecurityCards';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { Copy2, Refresh } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { AppTooltip } from '@/components/ui/tooltip';
import { useGetInviteLink, useUpdateInviteLinks } from '@/api/buster_rest/security/queryRequests';

export const InviteLinks = React.memo(() => {
  const { data: inviteLink } = useGetInviteLink();
  const { mutateAsync: updateInviteLink } = useUpdateInviteLinks();
  const enabled = inviteLink?.enabled ?? false;
  const link = inviteLink?.link ?? '';

  const { openInfoMessage } = useBusterNotifications();

  const onClickCopy = () => {
    navigator.clipboard.writeText(link);
    openInfoMessage('Invite link copied to clipboard');
  };

  const onClickRefresh = async () => {
    await updateInviteLink({ refresh_link: true });
    openInfoMessage('Invite link refreshed');
  };

  const onToggleEnabled = (enabled: boolean) => {
    updateInviteLink({ enabled });
  };

  return (
    <SecurityCards
      title="Invite links"
      description="A uniquely generated invite link allows anyone with the link to join your workspace"
      cards={[
        {
          sections: [
            <div key="title" className="flex items-center justify-between">
              <Text>Enable invite links</Text>
              <Switch checked={enabled} onCheckedChange={onToggleEnabled} />
            </div>,
            enabled && (
              <div key="link" className="flex items-center justify-between space-x-2">
                <div className="relative w-full">
                  <Input
                    className="w-full bg-transparent!"
                    disabled
                    value={link}
                    placeholder="Invite link"
                  />
                  <div className="absolute top-1/2 right-1 -translate-y-1/2">
                    <AppTooltip title="Refresh the invite link" side="top" sideOffset={8}>
                      <Button
                        variant="ghost"
                        size={'small'}
                        onClick={onClickRefresh}
                        suffix={<Refresh />}
                      />
                    </AppTooltip>
                  </div>
                </div>
                <Button variant="outlined" size={'tall'} onClick={onClickCopy} suffix={<Copy2 />}>
                  Copy
                </Button>
              </div>
            )
          ].filter(Boolean)
        }
      ]}
    />
  );
});

InviteLinks.displayName = 'InviteLinks';
