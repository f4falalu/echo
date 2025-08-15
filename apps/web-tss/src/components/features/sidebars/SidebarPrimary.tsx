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
import { useGetParentRoute } from '@/context/BusterAppLayout/useAppRoutes';
import {
  closeContactSupportModal,
  toggleContactSupportModal,
} from '@/context/BusterAppLayout/useContactSupportModalStore';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { createRoute } from '@/lib/tss-routes';
import { Route as AppChatsRoute } from '@/routes/app.chats.$chatId';
import { Route as AppChatRoute } from '@/routes/app.chats.index';
import { Route as AppCollectionsRoute } from '@/routes/app.collections.index';
import { Route as AppDashboardsRoute } from '@/routes/app.dashboards.index';
import { Route as AppDatasetsRoute } from '@/routes/app.datasets.index';
import { Route as AppHomeRoute } from '@/routes/app.home';
import { Route as AppLogsRoute } from '@/routes/app.logs.index';
import { Route as AppMetricIdRoute } from '@/routes/app.metrics.$metricId';
import { Route as AppMetricsRoute } from '@/routes/app.metrics.index';
import { Route as AppReportsRoute } from '@/routes/app.reports.index';
import { Route as AppSettingsRoute } from '@/routes/app.settings.profile';
import type { FileRoutesById, FileRouteTypes } from '@/routeTree.gen';
import { toggleInviteModal } from '../../../context/BusterAppLayout/useInviteModalStore';
import { ASSET_ICONS } from '../icons/assetIcons';
// import { InvitePeopleModal } from '../modal/InvitePeopleModal';
// import { SupportModal } from '../modal/SupportModal';
import { SidebarUserFooter } from './SidebarUserFooter';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

//import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

const topItems: ISidebarList = {
  id: 'top-items',
  items: [
    {
      label: 'Home',
      icon: <House4 />,
      route: { to: AppHomeRoute.to },
      id: AppHomeRoute.id,
    },
    {
      label: 'Chat history',
      icon: <ASSET_ICONS.chats />,
      route: { to: AppChatRoute.to },
      id: AppChatRoute.id,
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
      route: { to: AppMetricsRoute.to },
      id: AppMetricsRoute.id,
    },
    {
      label: 'Dashboards',
      icon: <ASSET_ICONS.dashboards />,
      route: { to: AppDashboardsRoute.to },
      id: AppDashboardsRoute.id,
    },
    {
      label: 'Collections',
      icon: <ASSET_ICONS.collections />,
      route: { to: AppCollectionsRoute.to },
      id: AppCollectionsRoute.id,
    },
    {
      label: 'Reports',
      icon: <ASSET_ICONS.reports />,
      route: { to: AppReportsRoute.to },
      id: AppReportsRoute.id,
      show: process.env.NEXT_PUBLIC_ENABLE_REPORTS === 'true',
    },
  ].filter((x) => x.show !== false),
};

const adminTools: ISidebarGroup = {
  label: 'Admin tools',
  id: 'admin-tools',
  items: [
    {
      label: 'Logs',
      icon: <UnorderedList2 />,
      route: { to: AppLogsRoute.to },
      id: AppLogsRoute.id,
      collapsedTooltip: 'Logs',
    },
    {
      label: 'Datasets',
      icon: <Table />,
      route: { to: AppDatasetsRoute.to },
      id: AppDatasetsRoute.id,
      collapsedTooltip: 'Datasets',
    },
  ],
};

const tryGroup = (showInvitePeople: boolean): ISidebarGroup => ({
  label: 'Try',
  id: 'try',
  items: [
    {
      label: 'Invite people',
      icon: <Plus />,
      route: null,
      id: 'invite-people',
      onClick: () => toggleInviteModal(),
      show: showInvitePeople,
    },
    {
      label: 'Leave feedback',
      icon: <Flag />,
      route: null,
      id: 'leave-feedback',
      onClick: () => toggleContactSupportModal('feedback'),
    },
  ].filter((x) => x.show !== false),
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

  console.log(sidebarItems);

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
    navigate({ to: AppHomeRoute.to });
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
