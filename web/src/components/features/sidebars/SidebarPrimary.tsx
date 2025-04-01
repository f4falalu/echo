'use client';

import React, { useMemo, useState } from 'react';
import { Sidebar } from '@/components/ui/sidebar/Sidebar';
import { BusterLogoWithText } from '@/assets/svg/BusterLogoWithText';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { ISidebarGroup, ISidebarList, SidebarProps } from '@/components/ui/sidebar';
import { BookOpen4, Flag, Gear, House4, Table, UnorderedList2, Plus } from '@/components/ui/icons';
import { PencilSquareIcon } from '@/components/ui/icons/customIcons/Pencil_Square';
import { ASSET_ICONS, assetTypeToIcon, assetTypeToRoute } from '../config/assetIcons';
import type { BusterUserFavorite } from '@/api/asset_interfaces/users';
import { Button } from '@/components/ui/buttons';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import Link from 'next/link';
import { useUserConfigContextSelector } from '@/context/Users';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { SupportModal } from '../modal/SupportModal';
import { InvitePeopleModal } from '../modal/InvitePeopleModal';
import { useMemoizedFn } from '@/hooks';
import { SidebarUserFooter } from './SidebarUserFooter/SidebarUserFooter';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites
} from '@/api/buster_rest';
import { useHotkeys } from 'react-hotkeys-hook';
import { useInviteModalStore } from '@/context/BusterAppLayout';

const topItems: ISidebarList = {
  id: 'top-items',
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
  label: 'Your stuff',
  id: 'your-stuff',
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
  id: 'admin-tools',
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

const tryGroup = (
  onClickInvitePeople: () => void,
  onClickLeaveFeedback: () => void
): ISidebarGroup => ({
  label: 'Try',
  id: 'try',
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

export const SidebarPrimary = React.memo(() => {
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const isUserRegistered = useUserConfigContextSelector((x) => x.isUserRegistered);
  const { data: favorites } = useGetUserFavorites();
  const currentRoute = useAppLayoutContextSelector((x) => x.currentRoute);
  const onToggleInviteModal = useInviteModalStore((s) => s.onToggleInviteModal);
  const [openSupportModal, setOpenSupportModal] = useState(false);
  const { mutateAsync: updateUserFavorites } = useUpdateUserFavorites();
  const { mutateAsync: deleteUserFavorite } = useDeleteUserFavorite();

  const onFavoritesReorder = useMemoizedFn((itemIds: string[]) => {
    updateUserFavorites(itemIds);
  });

  const sidebarItems: SidebarProps['content'] = useMemo(() => {
    if (!isUserRegistered) return [];

    const items = [topItems];

    if (isAdmin) {
      items.push(adminTools);
    }

    items.push(yourStuff);

    if (favorites && favorites.length > 0) {
      items.push(favoritesDropdown(favorites, { deleteUserFavorite, onFavoritesReorder }));
    }

    items.push(tryGroup(onToggleInviteModal, () => setOpenSupportModal(true)));

    return items;
  }, [isAdmin, isUserRegistered, favorites, currentRoute, onFavoritesReorder]);

  const onCloseSupportModal = useMemoizedFn(() => setOpenSupportModal(false));

  const HeaderMemoized = useMemo(
    () => <SidebarPrimaryHeader hideActions={!isUserRegistered} />,
    [isUserRegistered]
  );
  const FooterMemoized = useMemo(() => <SidebarUserFooter />, []);

  console.log(currentRoute);

  return (
    <>
      <Sidebar
        content={sidebarItems}
        header={HeaderMemoized}
        activeItem={currentRoute}
        footer={FooterMemoized}
      />

      <GlobalModals openSupportModal={openSupportModal} onCloseSupportModal={onCloseSupportModal} />
    </>
  );
});

SidebarPrimary.displayName = 'SidebarPrimary';

const SidebarPrimaryHeader: React.FC<{ hideActions?: boolean }> = ({ hideActions = false }) => {
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  useHotkeys('C', () => {
    onChangePage(BusterRoutes.APP_HOME);
  });

  return (
    <div className="flex items-center justify-between">
      <BusterLogoWithText />
      {!hideActions && (
        <div className="flex items-center gap-2">
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
      )}
    </div>
  );
};

const GlobalModals = ({
  openSupportModal,
  onCloseSupportModal
}: {
  openSupportModal: boolean;
  onCloseSupportModal: () => void;
}) => {
  const onToggleInviteModal = useInviteModalStore((s) => s.onToggleInviteModal);
  const openInviteModal = useInviteModalStore((s) => s.openInviteModal);
  const onCloseInviteModal = useMemoizedFn(() => onToggleInviteModal(false));
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);

  if (isAnonymousUser) return null;

  return (
    <>
      <InvitePeopleModal open={openInviteModal} onClose={onCloseInviteModal} />
      <SupportModal open={openSupportModal} onClose={onCloseSupportModal} />
    </>
  );
};
GlobalModals.displayName = 'GlobalModals';

const favoritesDropdown = (
  favorites: BusterUserFavorite[],
  {
    onFavoritesReorder,
    deleteUserFavorite
  }: {
    onFavoritesReorder: (itemIds: string[]) => void;
    deleteUserFavorite: (itemId: string) => void;
  }
): ISidebarGroup => {
  return {
    label: 'Favorites',
    id: 'favorites',
    isSortable: true,
    onItemsReorder: onFavoritesReorder,
    items: favorites.map((favorite) => {
      const Icon = assetTypeToIcon(favorite.asset_type);
      const route = assetTypeToRoute(favorite.asset_type, favorite.id);
      return {
        label: favorite.name,
        icon: <Icon />,
        route,
        id: favorite.id,
        onRemove: () => deleteUserFavorite(favorite.id)
      };
    })
  };
};
