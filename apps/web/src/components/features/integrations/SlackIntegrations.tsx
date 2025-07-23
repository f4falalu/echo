'use client';

import React, { useMemo } from 'react';

type SlackSharingPermission = 'shareWithWorkspace' | 'shareWithChannel' | 'noSharing';
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
import { LinkSlash, Refresh2, ChevronDown } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import pluralize from 'pluralize';
import { StatusCard } from '@/components/ui/card/StatusCard';

export const SlackIntegrations = React.memo(() => {
  const {
    data: slackIntegration,
    isFetched: isFetchedSlackIntegration,
    error: slackIntegrationError
  } = useGetSlackIntegration();

  const isConnected = slackIntegration?.connected ?? false;

  const cards = useMemo(() => {
    const sections = [
      <ConnectSlackCard key="connect-slack-card" />,
      isConnected && <ConnectedSlackChannels key="connected-slack-channels" />,
      isConnected && <SlackSharingPermissions key="slack-sharing-permissions" />
    ].filter(Boolean);
    return [{ sections }];
  }, [isConnected]);

  if (slackIntegrationError) {
    return <StatusCard message="Error fetching slack integration." variant={'danger'} />;
  }

  if (!isFetchedSlackIntegration) {
    return <div className="bg-gray-light/50 h-24 w-full animate-pulse rounded"></div>;
  }

  return <SettingsCards title="Slack" description="Connect Buster with Slack" cards={cards} />;
});

SlackIntegrations.displayName = 'SlackIntegrations';

const ConnectSlackCard = React.memo(() => {
  const { data: slackIntegration } = useGetSlackIntegration();
  const { mutate: initiateSlackOAuth } = useInitiateSlackOAuth();

  const isConnected = slackIntegration?.connected;
  const needsReinstall = slackIntegration?.status === 're_install_required';

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
        needsReinstall ? (
          <Button
            prefix={<SlackIcon size={16} />}
            onClick={() => initiateSlackOAuth()}
            size={'tall'}
            className="border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
            Re-install Required
          </Button>
        ) : (
          <ConnectedDropdown />
        )
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
    isRefetching: isRefetchingSlackChannels,
    refetch: refetchSlackChannels,
    isFetched: isFetchedSlackChannels,
    error: slackChannelsError
  } = useGetSlackChannels();

  const { mutate: updateSlackIntegration } = useUpdateSlackIntegration();

  const channels = slackChannelsData?.channels || [];
  const selectedChannelId = slackIntegration?.integration?.default_channel?.id;

  const items = useMemo(() => {
    return channels.map((channel) => ({
      label: channel.name,
      value: channel.id,
      selected: channel.id === selectedChannelId
    }));
  }, [channels, selectedChannelId]);

  const numberOfSelectedChannels = useMemo(() => {
    return items.filter((item) => item.selected).length;
  }, [items]);

  const onSelect = useMemoizedFn((channelId: string) => {
    const channel = channels.find((channel) => channel.id === channelId);
    if (!channel) return;
    updateSlackIntegration({
      default_channel: channel
    });
  });

  const showLoadingButton =
    isLoadingSlackChannels || isLoadingSlackIntegration || isRefetchingSlackChannels;

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-0.5">
        <Text>Alerts channel</Text>
        <Text variant="secondary" size={'xs'}>
          Select which slack channel Buster should send alerts to
        </Text>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end space-x-2">
        {!slackChannelsError ? (
          <>
            {isFetchedSlackChannels && (
              <Button
                size={'tall'}
                variant="ghost"
                loading={showLoadingButton}
                suffix={
                  !showLoadingButton && (
                    <span className="flex items-center justify-center text-base">
                      <Refresh2 />
                    </span>
                  )
                }
                onClick={() => refetchSlackChannels()}>
                Refresh
              </Button>
            )}

            <Dropdown
              selectType="multiple"
              items={items}
              onSelect={onSelect}
              menuHeader="Search channels"
              className="w-fit min-w-40">
              <WeirdFakeSelectButtonForBlake
                label={
                  numberOfSelectedChannels > 0
                    ? `${numberOfSelectedChannels} ${pluralize('channel', numberOfSelectedChannels)} selected`
                    : 'Select a channel'
                }
              />
            </Dropdown>
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

const SlackSharingPermissions = React.memo(() => {
  const { data: slackIntegration } = useGetSlackIntegration();
  const { mutate: updateSlackIntegration } = useUpdateSlackIntegration();

  const sharingOptions = [
    {
      label: 'Workspace',
      value: 'shareWithWorkspace',
      secondaryLabel: 'All workspace members will have access to any chat created from any channel.'
    },
    // {
    //   label: 'Channel',
    //   value: 'shareWithChannel',
    //   secondaryLabel: 'All channel members will have access to any chat created from that channel.'
    // },
    {
      label: 'None',
      value: 'noSharing',
      secondaryLabel: 'Only the user who sent the request will have access to their chat.'
    }
  ];

  const selectedOption: SlackSharingPermission =
    slackIntegration?.integration?.default_sharing_permissions || 'noSharing';
  const selectedLabel =
    sharingOptions.find((option) => option.value === selectedOption)?.label || 'Select option';

  const handleSelect = useMemoizedFn((value: string) => {
    updateSlackIntegration({
      default_sharing_permissions: value as SlackSharingPermission
    });
  });

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-0.5">
        <Text>Auto-share chats with other users</Text>
        <Text variant="secondary" size={'xs'}>
          Specify how chats are auto-shared when created from slack channels
        </Text>
      </div>
      <Dropdown
        items={sharingOptions}
        onSelect={handleSelect}
        align="end"
        side="bottom"
        selectType="single">
        <WeirdFakeSelectButtonForBlake label={selectedLabel} />
      </Dropdown>
    </div>
  );
});

SlackSharingPermissions.displayName = 'SlackSharingPermissions';

const WeirdFakeSelectButtonForBlake = ({ label }: { label: string }) => {
  return (
    <div className="bg-background hover:bg-item-hover flex min-w-32 cursor-pointer items-center justify-between space-x-2 rounded border px-3 py-1.5 transition-colors">
      <Text size="sm" className="truncate">
        {label}
      </Text>
      <span className="text-icon-color flex items-center">
        <ChevronDown />
      </span>
    </div>
  );
};
