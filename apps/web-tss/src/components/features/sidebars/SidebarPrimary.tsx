'use client';

import type { ShareAssetType } from '@buster/server-shared/share';
import { Link, matchByPath, matchPathname, type RouteMatch } from '@tanstack/react-router';
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
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { Route as AppChatRoute } from '@/routes/app.chats.index';
import { Route as AppCollectionsRoute } from '@/routes/app.collections.index';
import { Route as AppDashboardsRoute } from '@/routes/app.dashboards.index';
import { Route as AppDatasetsRoute } from '@/routes/app.datasets.index';
import { Route as AppHomeRoute } from '@/routes/app.home';
import { Route as AppLogsRoute } from '@/routes/app.logs.index';
import { Route as AppMetricsRoute } from '@/routes/app.metrics.index';
import { Route as AppReportsRoute } from '@/routes/app.reports.index';
import type { FileRoutesById, FileRouteTypes } from '@/routeTree.gen';
import { ASSET_ICONS } from '../icons/assetIcons';
import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

// import { InvitePeopleModal } from '../modal/InvitePeopleModal';
// import { SupportModal } from '../modal/SupportModal';
// import { SidebarUserFooter } from './SidebarUserFooter/SidebarUserFooter';
//import { useFavoriteSidebarPanel } from './useFavoritesSidebarPanel';

type FileRoutes = FileRouteTypes['id'];
const isMatchingParentRoute = (parentRoute: FileRoutes, to: FileRoutes): boolean => {
  return !!matchByPath(parentRoute, to, { to: to, fuzzy: true });
};

const topItems = (currentParentRoute: FileRoutes): ISidebarList => {
  return {
    id: 'top-items',
    items: [
      {
        label: 'Home',
        icon: <House4 />,
        route: AppHomeRoute.id,
        id: AppHomeRoute.id,
        active: currentParentRoute === AppHomeRoute.id,
      },
      {
        label: 'Chat history',
        icon: <ASSET_ICONS.chats />,
        route: AppChatRoute.id,
        id: AppChatRoute.id,
        active: isMatchingParentRoute(AppChatRoute.id, currentParentRoute),
      },
    ],
  };
};

const yourStuff = (
  currentParentRoute: FileRoutes,
  favoritedPageType: ShareAssetType | null
): ISidebarGroup => {
  const isActiveCheck = (type: ShareAssetType, route: FileRoutes) =>
    favoritedPageType !== type && favoritedPageType === null && currentParentRoute === route;

  return {
    label: 'Your stuff',
    id: 'your-stuff',
    items: [
      {
        label: 'Metrics',
        icon: <ASSET_ICONS.metrics />,
        route: AppMetricsRoute.id,
        id: AppMetricsRoute.id,
        active: isActiveCheck('metric', AppMetricsRoute.id),
      },
      {
        label: 'Dashboards',
        icon: <ASSET_ICONS.dashboards />,
        route: AppDashboardsRoute.id,
        id: AppDashboardsRoute.id,
        active: isActiveCheck('dashboard', AppDashboardsRoute.id),
      },
      {
        label: 'Collections',
        icon: <ASSET_ICONS.collections />,
        route: AppCollectionsRoute.id,
        id: AppCollectionsRoute.id,
        active: isActiveCheck('collection', AppCollectionsRoute.id),
      },
      process.env.NEXT_PUBLIC_ENABLE_REPORTS === 'true' && {
        label: 'Reports',
        icon: <ASSET_ICONS.reports />,
        route: AppReportsRoute.id,
        id: AppReportsRoute.id,
        active: isActiveCheck('report', AppReportsRoute.id),
      },
    ].filter(Boolean) as ISidebarItem[],
  };
};

const adminTools = (currentParentRoute: FileRoutes): ISidebarGroup => ({
  label: 'Admin tools',
  id: 'admin-tools',
  items: [
    {
      label: 'Logs',
      icon: <UnorderedList2 />,
      route: AppLogsRoute.id,
      id: AppLogsRoute.id,
      collapsedTooltip: 'Logs',
      active: isMatchingParentRoute(AppLogsRoute.id, currentParentRoute),
    },
    // {
    //   label: 'Terms & Definitions',
    //   icon: <BookOpen4 />,
    //   route: BusterRoutes.APP_TERMS,
    //   id: BusterRoutes.APP_TERMS
    // },
    {
      label: 'Datasets',
      icon: <Table />,
      route: AppDatasetsRoute.id,
      id: AppDatasetsRoute.id,
      active: isMatchingParentRoute(AppDatasetsRoute.id, currentParentRoute),
      collapsedTooltip: 'Datasets',
    },
  ].map((x) => ({
    ...x,
    active: x.route === currentParentRoute,
  })),
});

const tryGroup = (
  onClickInvitePeople: () => void,
  onClickLeaveFeedback: () => void,
  showInvitePeople: boolean
): ISidebarGroup => ({
  label: 'Try',
  id: 'try',
  items: [
    {
      label: 'Invite people',
      icon: <Plus />,
      route: null,
      id: 'invite-people',
      onClick: onClickInvitePeople,
      show: showInvitePeople,
    },
    {
      label: 'Leave feedback',
      icon: <Flag />,
      route: null,
      id: 'leave-feedback',
      onClick: onClickLeaveFeedback,
    },
  ].filter((x) => x.show !== false),
});

export const SidebarPrimary = React.memo(() => {
  const isAdmin = useIsUserAdmin();
  const restrictNewUserInvitations = useRestrictNewUserInvitations();
  const isUserRegistered = useIsUserRegistered();
  const parentRoute = useGetParentRoute();

  const { favoritesDropdownItems } = useFavoriteSidebarPanel();

  const topItemsItems = useMemo(() => topItems(parentRoute), [parentRoute]);

  // const adminToolsItems = useMemo(() => {
  //   if (!isAdmin) return null;
  //   return adminTools(currentParentRoute);
  // }, [isAdmin, currentParentRoute]);

  // const yourStuffItems = useMemo(
  //   () => yourStuff(currentParentRoute, favoritedPageType),
  //   [currentParentRoute, favoritedPageType]
  // );

  // const sidebarItems: SidebarProps['content'] = useMemo(() => {
  //   if (!isUserRegistered) return [];

  //   const items = [topItemsItems];

  //   if (adminToolsItems) {
  //     items.push(adminToolsItems);
  //   }

  //   items.push(yourStuffItems);

  //   if (favoritesDropdownItems) {
  //     items.push(favoritesDropdownItems);
  //   }

  //   items.push(
  //     tryGroup(
  //       onToggleInviteModal,
  //       () => onOpenContactSupportModal('feedback'),
  //       !restrictNewUserInvitations
  //     )
  //   );

  //   return items;
  // }, [
  //   isUserRegistered,
  //   adminToolsItems,
  //   restrictNewUserInvitations,
  //   yourStuffItems,
  //   favoritesDropdownItems,
  //   onToggleInviteModal,
  //   onOpenContactSupportModal,
  //   isAdmin,
  //   topItemsItems,
  // ]);

  // const onCloseSupportModal = useMemoizedFn(() => onOpenContactSupportModal(false));

  return (
    <>
      {/* <Sidebar
        content={sidebarItems}
        header={<SidebarPrimaryHeader hideActions={!isUserRegistered} />}
        footer={<SidebarUserFooter />}
        useCollapsible={isUserRegistered}
      /> */}

      {/* <GlobalModals onCloseSupportModal={onCloseSupportModal} /> */}
    </>
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader: React.FC<{ hideActions?: boolean }> = ({ hideActions = false }) => {
  // const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  // useHotkeys('C', () => {
  //   onChangePage(BusterRoutes.APP_HOME);
  // });

  return (
    <div className={cn(COLLAPSED_JUSTIFY_CENTER, 'flex min-h-7 items-center')}>
      {/* <Link href={createBusterRoute({ route: BusterRoutes.APP_HOME })}>
        <BusterLogoWithText className={COLLAPSED_HIDDEN} />
        <BusterLogo className={COLLAPSED_VISIBLE} />
      </Link>
      {!hideActions && (
        <div className={cn(COLLAPSED_HIDDEN, 'items-center gap-2')}>
          <Tooltip title="Settings">
            <Link href={createBusterRoute({ route: BusterRoutes.SETTINGS_PROFILE })}>
              <Button prefix={<Gear />} variant="ghost" />
            </Link>
          </Tooltip>
          <Tooltip title="Start a chat" shortcuts={['C']}>
            <Link href={createBusterRoute({ route: BusterRoutes.APP_HOME })}>
              <Button
                size="tall"
                rounding={'large'}
                prefix={
                  <div className="flex items-center justify-center">
                    <PencilSquareIcon />
                  </div>
                }
              />
            </Link>
          </Tooltip>
        </div>
      )} */}
    </div>
  );
};

const GlobalModals = ({ onCloseSupportModal }: { onCloseSupportModal: () => void }) => {
  const { toggleInviteModal, closeInviteModal, openInviteModal } = useInviteModalStore();
  const isAnonymousUser = useIsAnonymousUser();
  const { formType } = useContactSupportModalStore();

  // if (isAnonymousUser) return null;

  return (
    <>
      {/* <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
      <SupportModal formType={formType} onClose={onCloseSupportModal} /> */}
    </>
  );
};
GlobalModals.displayName = 'GlobalModals';
