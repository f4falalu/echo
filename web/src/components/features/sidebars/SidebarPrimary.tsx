import React, { useMemo } from 'react';
import { Sidebar } from '@/components/ui/sidebar/Sidebar';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { ISidebarGroup, ISidebarList, SidebarProps } from '@/components/ui/sidebar/interfaces';
import { BookOpen4, Flag, Gear, House4, Table, UnorderedList2, Plus } from '@/components/ui/icons';
import { ASSET_ICONS, assetTypeToIcon, assetTypeToRoute } from '../config/assetIcons';
import type { BusterUserFavorite } from '@/api/asset_interfaces/users';
import { Button } from '@/components/ui/buttons';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import Link from 'next/link';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';

const topItems: ISidebarList = {
  items: [
    {
      label: 'Home',
      icon: <House4 />,
      route: BusterRoutes.APP_HOME,
      id: BusterRoutes.APP_HOME
    },
    {
      label: 'Chat history',
      icon: <ASSET_ICONS.chats />,
      route: BusterRoutes.APP_CHAT,
      id: BusterRoutes.APP_CHAT
    }
  ]
};

const yourStuff: ISidebarGroup = {
  label: 'Your stuffs',
  items: [
    {
      label: 'Metrics',
      icon: <ASSET_ICONS.metrics />,
      route: BusterRoutes.APP_METRIC,
      id: BusterRoutes.APP_METRIC
    },
    {
      label: 'Dashboards',
      icon: <ASSET_ICONS.dashboards />,
      route: BusterRoutes.APP_DASHBOARDS,
      id: BusterRoutes.APP_DASHBOARDS
    },
    {
      label: 'Collections',
      icon: <ASSET_ICONS.collections />,
      route: BusterRoutes.APP_COLLECTIONS,
      id: BusterRoutes.APP_COLLECTIONS
    }
  ]
};

const adminTools: ISidebarGroup = {
  label: 'Admin tools',
  items: [
    {
      label: 'Logs',
      icon: <UnorderedList2 />,
      route: BusterRoutes.APP_LOGS,
      id: BusterRoutes.APP_LOGS
    },
    {
      label: 'Terms & Definitions',
      icon: <BookOpen4 />,
      route: BusterRoutes.APP_TERMS,
      id: BusterRoutes.APP_TERMS
    },
    {
      label: 'Datasets',
      icon: <Table />,
      route: BusterRoutes.APP_DATASETS,
      id: BusterRoutes.APP_DATASETS
    }
  ]
};

const tryGroup = (onClickInvitePeople: () => void, onClickLeaveFeedback: () => void) => ({
  label: 'Try',
  items: [
    {
      label: 'Invite people',
      icon: <Plus />,
      route: null,
      id: 'invite-people',
      onClick: onClickInvitePeople
    },
    {
      label: 'Leave feedback',
      icon: <Flag />,
      route: null,
      id: 'leave-feedback',
      onClick: onClickLeaveFeedback
    }
  ]
});

export const SidebarPrimary: React.FC<{
  isAdmin: boolean;
  activePage: string;
  favorites: BusterUserFavorite[] | null;
  onClickInvitePeople: () => void;
  onClickLeaveFeedback: () => void;
}> = React.memo(({ isAdmin, activePage, favorites, onClickInvitePeople, onClickLeaveFeedback }) => {
  const sidebarItems: SidebarProps['content'] = useMemo(() => {
    const items = [topItems];

    if (isAdmin) {
      items.push(adminTools);
    }

    items.push(yourStuff);

    if (favorites && favorites.length > 0) {
      items.push(favoritesDropdown(favorites));
    }

    items.push(tryGroup(onClickInvitePeople, onClickLeaveFeedback));

    return items;
  }, [isAdmin, activePage]);

  return (
    <Sidebar content={sidebarItems} header={<SidebarPrimaryHeader />} activeItem={activePage} />
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader = React.memo(() => {
  return (
    <div className="flex items-center justify-between">
      <BusterLogoWithText />
      <div className="flex items-center gap-2">
        <Tooltip title="Settings">
          <Link href={createBusterRoute({ route: BusterRoutes.SETTINGS_GENERAL })}>
            <Button prefix={<Gear />} variant="ghost" />
          </Link>
        </Tooltip>
        <Tooltip title="Start a chat">
          <Link href={createBusterRoute({ route: BusterRoutes.SETTINGS_GENERAL })}>
            <Button
              size="tall"
              rounding={'large'}
              prefix={
                <div className="translate-x-[-1px] translate-y-[-1px]">
                  <PencilSquareIcon />
                </div>
              }
            />
          </Link>
        </Tooltip>
      </div>
    </div>
  );
});

const favoritesDropdown = (favorites: BusterUserFavorite[]): ISidebarGroup => {
  return {
    label: 'Favorites',
    items: favorites.map((favorite) => {
      const Icon = assetTypeToIcon(favorite.asset_type);
      const route = assetTypeToRoute(favorite.asset_type, favorite.id);
      return {
        label: favorite.name,
        icon: <Icon />,
        route,
        id: route
      };
    })
  };
};
