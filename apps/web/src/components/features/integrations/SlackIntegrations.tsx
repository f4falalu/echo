import React from 'react';
import { SettingsCards } from '../settings/SettingsCard';
import { SlackIcon } from '@/components/ui/icons/customIcons/SlackIcon';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';

export const SlackIntegrations = React.memo(() => {
  return (
    <SettingsCards
      title="Slack"
      description="Connect Buster with Slack"
      cards={[{ sections: [<ConnectSlackCard />] }]}
    />
  );
});

SlackIntegrations.displayName = 'SlackIntegrations';

const ConnectSlackCard = React.memo(() => {
  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex space-x-2">
        <div className="bg-item-select flex items-center justify-center rounded p-2">
          <SlackIcon size={16} />
        </div>
        <div className="flex flex-col space-y-0.5">
          <Text>Slack account</Text>
          <Text variant="secondary" size={'xs'}>
            Link your slack account to use Buster from Slack
          </Text>
        </div>
      </div>
      <Button prefix={<SlackIcon size={16} />} size={'tall'}>
        Connect Slack
      </Button>
    </div>
  );
});
