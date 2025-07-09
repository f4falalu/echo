'use client';

import React from 'react';
import { SettingsCards } from '../settings/SettingsCard';
import { SlackIcon } from '@/components/ui/icons/customIcons/SlackIcon';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import {
  useGetSlackChannels,
  useGetSlackIntegration,
  useInitiateSlackOAuth,
  useRemoveSlackIntegration,
  useUpdateSlackIntegration
} from '@/api/buster_rest/slack/queryRequests';
import { Dropdown, type DropdownItems } from '@/components/ui/dropdown';
import { LinkSlash, Refresh2 } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';

export const SlackIntegrations = React.memo(() => {
  const { data: slackIntegration } = useGetSlackIntegration();
  const isConnected = slackIntegration?.connected ?? false;

  return (
    <SettingsCards
      title="Slack"
      description="Connect Buster with Slack"
      cards={[
        {
          sections: [
            <ConnectSlackCard key="connect-slack-card" />,
            isConnected && <ConnectedSlackChannels key="connected-slack-channels" />
          ].filter(Boolean)
        }
      ]}
    />
  );
});

SlackIntegrations.displayName = 'SlackIntegrations';

const ConnectSlackCard = React.memo(() => {
  const { data: slackIntegration } = useGetSlackIntegration();
  const { mutate: initiateSlackOAuth } = useInitiateSlackOAuth();

  const isConnected = slackIntegration?.connected;

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

      {isConnected ? (
        <ConnectedDropdown />
      ) : (
        <Button prefix={<SlackIcon size={16} />} onClick={() => initiateSlackOAuth()} size={'tall'}>
          Connect Slack
        </Button>
      )}
    </div>
  );
});

ConnectSlackCard.displayName = 'ConnectSlackCard';

const ConnectedDropdown = React.memo(() => {
  const { mutate: removeSlackIntegration, isPending } = useRemoveSlackIntegration();

  const dropdownItems: DropdownItems = [
    {
      value: 'disconnect',
      label: 'Disconnect',
      icon: <LinkSlash />,
      onClick: () => {
        removeSlackIntegration();
      },
      loading: isPending
    }
  ];

  return (
    <Dropdown items={dropdownItems} align="end" side="bottom">
      <div className="hover:bg-item-hover flex! cursor-pointer items-center space-x-1.5 rounded p-1.5">
        <div className="bg-success-foreground h-2.5 w-2.5 rounded-full" />
        <Text className="select-none">Connected</Text>
      </div>
    </Dropdown>
  );
});

ConnectedDropdown.displayName = 'ConnectedDropdown';

const ConnectedSlackChannels = React.memo(() => {
  const { data: slackIntegration, isLoading: isLoadingSlackIntegration } = useGetSlackIntegration();
  const {
    data: slackChannelsData,
    isLoading: isLoadingSlackChannels,
    refetch: refetchSlackChannels,
    isFetched: isFetchedSlackChannels,
    error: slackChannelsError
  } = useGetSlackChannels();
  const { mutate: updateSlackIntegration } = useUpdateSlackIntegration();

  const channels = slackChannelsData?.channels || [];
  const selectedChannelId = slackIntegration?.integration?.default_channel?.id;

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-0.5">
        <Text>Alerts channels</Text>
        <Text variant="secondary" size={'xs'}>
          Select which slack channel Buster should send alerts to
        </Text>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end space-x-2">
        {!slackChannelsError ? (
          <>
            {isFetchedSlackChannels && (
              <Button
                size={'small'}
                variant="ghost"
                suffix={<Refresh2 />}
                onClick={() => refetchSlackChannels()}>
                Refresh
              </Button>
            )}

            <Select
              className="w-fit min-w-40"
              items={channels.map((channel) => ({
                label: channel.name,
                value: channel.id
              }))}
              placeholder="Select a channel"
              value={selectedChannelId}
              onChange={(channelId) => {
                const channel = channels.find((channel) => channel.id === channelId);
                if (!channel) return;
                updateSlackIntegration({
                  default_channel: channel
                });
              }}
              loading={isLoadingSlackChannels || isLoadingSlackIntegration}
            />
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Text variant="danger" size={'xs'}>
              Error fetching channels.
            </Text>
          </div>
        )}
      </div>
    </div>
  );
});

ConnectedSlackChannels.displayName = 'ConnectedSlackChannels';
