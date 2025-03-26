import {
  useAddDashboardToCollection,
  useDeleteDashboards,
  useGetDashboard,
  useRemoveDashboardFromCollection
} from '@/api/buster_rest/dashboards';
import { DropdownContent, DropdownItem, DropdownItems } from '@/components/ui/dropdown';
import {
  Trash,
  Dots,
  Pencil,
  History,
  Star,
  ShareRight,
  Plus,
  Filter
} from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { useMemo } from 'react';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import React from 'react';
import { timeFromNow } from '@/lib/date';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { useMemoizedFn } from '@/hooks';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { ShareAssetType } from '@/api/asset_interfaces/share';
import { useFavoriteStar } from '@/components/features/list/FavoriteStar';
import { timeout } from '@/lib';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import { DASHBOARD_TITLE_INPUT_ID } from '@/controllers/DashboardController/DashboardViewDashboardController/DashboardEditTitle';
import { canEdit, canFilter, getIsEffectiveOwner } from '@/lib/share';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { useDashboardContentStore } from '@/context/Dashboards';

export const DashboardThreeDotMenu = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const versionHistoryItems = useVersionHistorySelectMenu({ dashboardId });
  const collectionSelectMenu = useCollectionSelectMenu({ dashboardId });
  const favoriteDashboard = useFavoriteDashboardSelectMenu({ dashboardId });
  const deleteDashboardMenu = useDeleteDashboardSelectMenu({ dashboardId });
  const renameDashboardMenu = useRenameDashboardSelectMenu({ dashboardId });
  const shareMenu = useShareMenuSelectMenu({ dashboardId });
  const addContentToDashboardMenu = useAddContentToDashboardSelectMenu();
  const filterDashboardMenu = useFilterDashboardSelectMenu();
  const { data: permission } = useGetDashboard({ id: dashboardId }, (x) => x.permission);
  const isOwner = getIsEffectiveOwner(permission);
  const isFilter = canFilter(permission);
  const isEditor = canEdit(permission);

  const items: DropdownItems = useMemo(
    () => [
      isFilter && filterDashboardMenu,
      isEditor && addContentToDashboardMenu,
      { type: 'divider' },
      isOwner && shareMenu,
      collectionSelectMenu,
      favoriteDashboard,
      versionHistoryItems,
      { type: 'divider' },
      isEditor && renameDashboardMenu,
      isOwner && deleteDashboardMenu
    ],
    [
      filterDashboardMenu,
      addContentToDashboardMenu,
      shareMenu,
      collectionSelectMenu,
      favoriteDashboard,
      versionHistoryItems,
      renameDashboardMenu,
      deleteDashboardMenu
    ]
  );

  return (
    <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
      <Button prefix={<Dots />} variant="ghost" />
    </Dropdown>
  );
});
DashboardThreeDotMenu.displayName = 'ThreeDotMenuButton';

const useVersionHistorySelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { data } = useGetDashboard({ id: dashboardId }, (x) => ({
    versions: x?.dashboard?.versions || [],
    version_number: x?.dashboard?.version_number
  }));
  const { versions, version_number } = data || {};

  const versionHistoryItems: DropdownItems = useMemo(() => {
    return [...(versions || [])].reverse().map((x) => ({
      label: `Version ${x.version_number}`,
      secondaryLabel: timeFromNow(x.updated_at, false),
      value: x.version_number.toString(),
      selected: x.version_number === version_number
    }));
  }, [versions, version_number]);

  return useMemo(
    () => ({
      label: 'Version history',
      value: 'version-history',
      icon: <History />,
      items: versionHistoryItems
    }),
    [versionHistoryItems]
  );
};

const useCollectionSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { mutateAsync: saveDashboardToCollection } = useAddDashboardToCollection();
  const { mutateAsync: removeDashboardFromCollection } = useRemoveDashboardFromCollection();
  const { data: collections } = useGetDashboard({ id: dashboardId }, (x) => x.collections);
  const { openInfoMessage } = useBusterNotifications();

  const selectedCollections = useMemo(() => {
    return collections?.map((x) => x.id) || [];
  }, [collections]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveDashboardToCollection({ dashboardIds: [dashboardId], collectionIds });
    openInfoMessage('Dashboard saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeDashboardFromCollection({
      dashboardIds: [dashboardId],
      collectionIds: [collectionId]
    });
    openInfoMessage('Dashboard removed from collections');
  });

  const { modal, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections
  });

  const collectionSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const collectionDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Add to collection',
      value: 'add-to-collection',
      icon: <ASSET_ICONS.collectionAdd />,
      items: [
        <React.Fragment key="collection-sub-menu">
          {collectionSubMenu} {modal}
        </React.Fragment>
      ]
    }),
    [collectionSubMenu]
  );

  return collectionDropdownItem;
};

const useFavoriteDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { data: title } = useGetDashboard({ id: dashboardId }, (x) => x?.dashboard?.name);
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: dashboardId,
    type: ShareAssetType.DASHBOARD,
    name: title || ''
  });

  const item: DropdownItem = useMemo(
    () => ({
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      value: 'add-to-favorites',
      icon: isFavorited ? <StarFilled /> : <Star />,
      onClick: onFavoriteClick
    }),
    [isFavorited, onFavoriteClick]
  );

  return item;
};

const useDeleteDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { mutateAsync: deleteDashboard } = useDeleteDashboards();

  return useMemo(
    () => ({
      label: 'Delete dashboard',
      value: 'delete-dashboard',
      icon: <Trash />,
      onClick: async () => {
        await deleteDashboard({ dashboardId });
      }
    }),
    [dashboardId]
  );
};

const useRenameDashboardSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  return useMemo(
    () => ({
      label: 'Rename dashboard',
      value: 'rename-dashboard',
      icon: <Pencil />,
      onClick: async () => {
        onSetFileView({ fileView: 'dashboard', fileId: dashboardId });
        await timeout(125);
        const input = document.getElementById(DASHBOARD_TITLE_INPUT_ID) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }),
    [dashboardId]
  );
};

export const useShareMenuSelectMenu = ({ dashboardId }: { dashboardId: string }) => {
  const { data: dashboard } = useGetDashboard({ id: dashboardId }, getShareAssetConfig);
  const isOwner = getIsEffectiveOwner(dashboard?.permission);

  return useMemo(
    () => ({
      label: 'Share',
      value: 'share-dashboard',
      icon: <ShareRight />,
      disabled: !isOwner,
      items: isOwner
        ? [
            <ShareMenuContent
              key={dashboardId}
              shareAssetConfig={dashboard!}
              assetId={dashboardId}
              assetType={ShareAssetType.DASHBOARD}
            />
          ]
        : undefined
    }),
    [dashboardId]
  );
};

const useAddContentToDashboardSelectMenu = () => {
  const onOpenAddContentModal = useDashboardContentStore((x) => x.onOpenAddContentModal);

  return useMemo(
    () => ({
      label: 'Add content',
      value: 'add-content',
      icon: <Plus />,
      onClick: onOpenAddContentModal
    }),
    [onOpenAddContentModal]
  );
};

const useFilterDashboardSelectMenu = () => {
  return useMemo(
    () => ({
      label: 'Filter dashboard',
      value: 'filter-dashboard',
      icon: <Filter />,
      items: [
        <div className="p-2" key="coming-soon">
          Coming soon...
        </div>
      ]
    }),
    []
  );
};
