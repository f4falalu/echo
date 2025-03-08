import React from 'react';
import { Separator } from '@/components/ui/seperator';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';

export const IP_ADDRESSES = ['44.219.39.124', '34.230.173.35', '100.26.25.127'];

export const WhiteListBlock: React.FC = () => {
  const numberOfIpAddresses = IP_ADDRESSES.length;
  const { openInfoMessage } = useBusterNotifications();

  const onClickIpAddress = useMemoizedFn((ip: string) => {
    navigator.clipboard.writeText(ip);
    openInfoMessage('Copied to clipboard');
  });
  return (
    <div className="bg-background flex flex-col space-y-2 rounded border border-gray-200 p-4">
      <Text variant="secondary">{`If you would like to whitelist our IP addresses, they are: `}</Text>

      <div className="flex w-fit rounded-sm border p-1.5">
        {IP_ADDRESSES.map((ip, index) => {
          return (
            <div
              className="flex cursor-pointer items-center"
              onClick={() => onClickIpAddress(ip)}
              key={index}>
              <div>{ip}</div>
              {index !== numberOfIpAddresses - 1 && (
                <Separator className="h-full" orientation="vertical" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
