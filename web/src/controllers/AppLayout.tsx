'use client';

import React, { PropsWithChildren, useMemo } from 'react';
import { AppSidebar } from './AppSidebar';
import { NewChatModal } from '@/components/features/modals/NewChatModal';
import { InvitePeopleModal } from '@/components/features/modals/InvitePeopleModal';
import { AppSplitter } from '@/components/ui/layouts';
import { createStyles } from 'antd-style';
import { useUserConfigContextSelector } from '@/context/Users';
import { SupportModal } from '@/components/features/modals/SupportModal';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from 'ahooks';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/classMerge';

const layoutStyle = {
  overflow: 'hidden',
  minHeight: '100vh'
};

export const AppLayout: React.FC<
  PropsWithChildren<{
    defaultLayout: (number | string)[];
    signOut: () => void;
  }>
> = ({ defaultLayout, children, signOut }) => {
  const searchParams = useSearchParams();
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const hideSidePanel = isAnonymousUser;
  const embedView = searchParams.get('embed') === 'true';

  return (
    <AppSplitter
      defaultLayout={defaultLayout}
      autoSaveId="app-layout"
      preserveSide="left"
      splitterClassName={''}
      leftPanelMinSize={'190px'}
      leftPanelMaxSize={'300px'}
      hideSplitter={true}
      style={layoutStyle}
      leftHidden={hideSidePanel}
      leftChildren={<AppSidebar signOut={signOut} />}
      rightChildren={
        <AppLayoutContent
          isAnonymousUser={isAnonymousUser}
          hideSidePanel={hideSidePanel}
          embedView={embedView}>
          {children}
        </AppLayoutContent>
      }
    />
  );
};

const AppLayoutContent: React.FC<
  PropsWithChildren<{
    hideSidePanel: boolean;
    isAnonymousUser: boolean;
    embedView?: boolean;
  }>
> = React.memo(({ children, isAnonymousUser, hideSidePanel, embedView }) => {
  const onToggleInviteModal = useAppLayoutContextSelector((s) => s.onToggleInviteModal);
  const openInviteModal = useAppLayoutContextSelector((s) => s.openInviteModal);
  const onToggleChatsModal = useAppLayoutContextSelector((s) => s.onToggleChatsModal);
  const openChatsModal = useAppLayoutContextSelector((s) => s.openChatsModal);
  const onToggleSupportModal = useAppLayoutContextSelector((s) => s.onToggleSupportModal);
  const openSupportModal = useAppLayoutContextSelector((s) => s.openSupportModal);
  const userOrganizations = useUserConfigContextSelector((x) => x.userOrganizations);

  const onCloseChatsModal = useMemoizedFn(() => onToggleChatsModal(false));
  const onCloseInviteModal = useMemoizedFn(() => onToggleInviteModal(false));
  const onCloseSupportModal = useMemoizedFn(() => onToggleSupportModal(false));

  const hasOrganization = !!userOrganizations;

  const layoutClassName = useMemo(
    () =>
      embedView
        ? ''
        : cn(
            `mr-2 mt-2 overflow-hidden rounded-md border-[0.5px] border-border min-h-[calc(100vh_-_16px)] h-[calc(100vh_-_16px)] max-h-[calc(100vh_-_16px)]`,
            { 'ml-2': hideSidePanel }
          ),
    [embedView, hideSidePanel]
  );

  return (
    <>
      <div className={layoutClassName}>{children}</div>

      {!isAnonymousUser && hasOrganization && (
        <>
          <NewChatModal open={openChatsModal} onClose={onCloseChatsModal} />
          <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
          <SupportModal open={openSupportModal} onClose={onCloseSupportModal} />
        </>
      )}
    </>
  );
});
AppLayoutContent.displayName = 'AppLayoutContent';
