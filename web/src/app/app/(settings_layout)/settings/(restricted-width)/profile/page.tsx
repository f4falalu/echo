'use client';

import React from 'react';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { useUserConfigContextSelector } from '@/context/Users';
import { formatDate } from '@/lib/date';
import { Title, Text } from '@/components/ui/typography';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card/CardBase';
import { cn } from '@/lib/classMerge';

export default function ProfilePage() {
  const user = useUserConfigContextSelector((state) => state.user);

  if (!user) return <></>;

  const { name, email, created_at } = user;

  return (
    <div>
      <SettingsPageHeader title="Profile" description="Manage your profile & information" />
      <Card>
        <CardHeader>
          <div className={'flex items-center space-x-2.5'}>
            <Avatar name={name} className="h-[48px] w-[48px]" />
            <Title as="h4">{name}</Title>
          </div>
        </CardHeader>
        <div className={'flex flex-col space-y-0.5'}>
          <div className={cn('flex items-center space-x-2.5')}>
            <Text variant="secondary" className={'w-full max-w-[120px]'}>
              Email
            </Text>
            <Text className={'flex-1'}>{email}</Text>
          </div>
          <div className={cn('flex items-center space-x-2.5')}>
            <Text variant="secondary" className={'w-full max-w-[120px]'}>
              Member Since
            </Text>
            <Text className={'flex-1'}>{formatDate({ date: created_at, format: 'll' })}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
