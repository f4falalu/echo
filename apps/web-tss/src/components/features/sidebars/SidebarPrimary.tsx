'use client';

import type { ShareAssetType } from '@buster/server-shared/share';
import {
  Link,
  MatchRoute,
  matchByPath,
  matchPathname,
  type RouteMatch,
  useLinkProps,
  useMatch,
  useMatches,
  useMatchRoute,
  useNavigate,
} from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  useIsAnonymousUser,
  useIsUserAdmin,
  useIsUserRegistered,
  useRestrictNewUserInvitations,
} from '@/api/buster_rest/users/useGetUserInfo';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { Button } from '@/components/ui/buttons';
import { Flag, Gear, House4, Plus, Table, UnorderedList2 } from '@/components/ui/icons';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';
import {
  COLLAPSED_HIDDEN,
  COLLAPSED_JUSTIFY_CENTER,
  COLLAPSED_VISIBLE,
  type ISidebarGroup,
  type ISidebarItem,
  type ISidebarList,
  type SidebarProps,
} from '@/components/ui/sidebar';
import { Sidebar } from '@/components/ui/sidebar/Sidebar';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { useContactSupportModalStore, useInviteModalStore } from '@/context/BusterAppLayout';
import { toggleContactSupportModal } from '@/context/BusterAppLayout/useContactSupportModalStore';
import { cn } from '@/lib/classMerge';
import { Route as AppHomeRoute } from '@/routes/app.home';
import { Route as AppSettingsRoute } from '@/routes/app.settings.profile';
import { toggleInviteModal } from '../../../context/BusterAppLayout/useInviteModalStore';
import { ASSET_ICONS } from '../icons/assetIcons';
// import { InvitePeopleModal } from '../modal/InvitePeopleModal';
// import { SupportModal } from '../modal/SupportModal';
import { SidebarUserFooter } from './SidebarUserFooter';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

const topItems: ISidebarList = {
  id: 'top-items',
  items: [
    {
      label: 'Home',
      icon: <House4 />,
      route: { to: '/app/home' },
      id: '/app/home',
      preload: 'viewport',
      preloadDelay: 1000,
    },
    {
      label: 'Chat history',
      icon: <ASSET_ICONS.chats />,
      route: { to: '/app/chats' },
      id: '/app/chats/',
      preload: 'viewport',
      preloadDelay: 2000,
      activeOptions: {
        exact: true,
      },
      activeProps: {},
    },
  ],
};

const yourStuff: ISidebarGroup = {
  label: 'Your stuff',
  id: 'your-stuff',
  items: [
    {
      label: 'Metrics',
      icon: <ASSET_ICONS.metrics />,
      route: { to: '/app/metrics' },
      id: '/app/metrics',
      preload: 'intent',
      preloadDelay: 1000,
    },
    {
      label: 'Dashboards',
      icon: <ASSET_ICONS.dashboards />,
      route: { to: '/app/dashboards' },
      id: '/app/dashboards/',
      preload: 'intent',
      preloadDelay: 1000,
    },
    {
      label: 'Collections',
      icon: <ASSET_ICONS.collections />,
      route: { to: '/app/collections' },
      id: '/app/collections/',
      preload: 'intent',
      preloadDelay: 1000,
    },
    {
      label: 'Reports',
      icon: <ASSET_ICONS.reports />,
      route: { to: '/app/reports' },
      id: '/app/reports/',
      preload: 'intent',
    },
  ] satisfies (ISidebarItem & { show?: boolean })[],
};

const adminTools: ISidebarGroup = {
  label: 'Admin tools',
  id: 'admin-tools',
  items: [
    {
      label: 'Logs',
      icon: <UnorderedList2 />,
      route: { to: '/app/logs' },
      id: '/app/logs/',
      collapsedTooltip: 'Logs',
      preload: 'viewport',
    },
    {
      label: 'Datasets',
      icon: <Table />,
      route: { to: '/app/datasets' },
      id: '/app/datasets/',
      collapsedTooltip: 'Datasets',
    },
  ] satisfies ISidebarItem[],
};

const tryGroup = (showInvitePeople: boolean): ISidebarGroup => ({
  label: 'Try',
  id: 'try',
  items: [
    {
      label: 'Invite people',
      icon: <Plus />,
      id: 'invite-people',
      onClick: () => toggleInviteModal(),
      show: showInvitePeople,
    },
    {
      label: 'Leave feedback',
      icon: <Flag />,
      id: 'leave-feedback',
      onClick: () => toggleContactSupportModal('feedback'),
    },
  ].reduce((acc, { show, ...item }) => {
    if (show !== false) acc.push(item);
    return acc;
  }, [] as ISidebarItem[]),
});

export const SidebarPrimary = React.memo(() => {
  const isAdmin = useIsUserAdmin();
  const restrictNewUserInvitations = useRestrictNewUserInvitations();
  const isUserRegistered = useIsUserRegistered();

  const favoritesDropdownItems = useFavoriteSidebarPanel();

  const tryGroupMemoized = useMemo(
    () => tryGroup(!restrictNewUserInvitations),
    [restrictNewUserInvitations]
  );

  const sidebarItems: SidebarProps['content'] = useMemo(() => {
    if (!isUserRegistered) return [];

    const items = [topItems];

    if (isAdmin) {
      items.push(adminTools);
    }

    items.push(yourStuff);

    if (favoritesDropdownItems) {
      items.push(favoritesDropdownItems);
    }

    items.push(tryGroupMemoized);

    return items;
  }, [isUserRegistered, restrictNewUserInvitations, favoritesDropdownItems, isAdmin, topItems]);

  return (
    <>
      <Sidebar
        content={sidebarItems}
        header={<SidebarPrimaryHeader hideActions={!isUserRegistered} />}
        footer={<SidebarUserFooter />}
        useCollapsible={isUserRegistered}
      />

      <GlobalModals />
    </>
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader: React.FC<{ hideActions?: boolean }> = ({ hideActions = false }) => {
  const navigate = useNavigate();

  useHotkeys('C', () => {
    navigate({ to: '/app/home' });
  });

  return (
    <div className={cn(COLLAPSED_JUSTIFY_CENTER, 'flex min-h-7 items-center')}>
      <Link to={AppHomeRoute.to}>
        <BusterLogoWithText className={COLLAPSED_HIDDEN} />
        <BusterLogo className={COLLAPSED_VISIBLE} />
      </Link>
      {!hideActions && (
        <div className={cn(COLLAPSED_HIDDEN, 'items-center gap-2')}>
          <Tooltip title="Settings">
            <Link to={AppSettingsRoute.to}>
              <Button prefix={<Gear />} variant="ghost" />
            </Link>
          </Tooltip>
          <Tooltip title="Start a chat" shortcuts={['C']}>
            <Link to={AppHomeRoute.to}>
              <Button size="tall" rounding={'large'} prefix={<PencilSquareIcon />} />
            </Link>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

const GlobalModals = () => {
  const { toggleInviteModal, closeInviteModal, openInviteModal } = useInviteModalStore();
  const isAnonymousUser = useIsAnonymousUser();
  const { formType } = useContactSupportModalStore();

  if (isAnonymousUser) return null;

  return (
    <>
      {/* <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
      <SupportModal formType={formType} onClose={onCloseSupportModal} /> */}
    </>
  );
};
GlobalModals.displayName = 'GlobalModals';
