import React, { useState } from 'react';
import { SecurityCards } from './SecurityCards';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { Copy2, Refresh } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { AppTooltip } from '@/components/ui/tooltip';

export const InviteLinks = () => {
  const [enabled, setEnabled] = useState(false);
  const [link, setLink] = useState('');
  const { openInfoMessage } = useBusterNotifications();

  const onClickCopy = () => {
    navigator.clipboard.writeText(link);
    openInfoMessage('Invite link copied to clipboard');
  };

  const onClickRefresh = () => {
    setLink(Math.random().toString(36).substring(2, 15));
    openInfoMessage('Invite link refreshed');
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
              <Switch checked={enabled} onCheckedChange={setEnabled} />
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
};
