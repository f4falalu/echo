import type { BusterUserFavorite } from '@/api/asset_interfaces';
import { ShareAssetType } from '@/api/asset_interfaces';
import { AppMenuGroupSingleSortable } from '@/components/menu';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useUserConfigContextSelector } from '@/context/Users';
import { BusterRoutes, createBusterRoute } from '@/routes';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useMemoizedFn } from 'ahooks';
import { asset_typeToIcon } from '@/components/icons';

export const FavoritesDropdown: React.FC<{}> = React.memo(() => {
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);
  const [openedIds, setOpenedIds] = useState<string[]>([]);

  const favoritesList = useMemo(() => {
    return userFavorites.map((item) => {
      return createListItem({ item, openedIds });
    });
  }, [userFavorites]);

  const hasFavorites = !isEmpty(favoritesList);

  if (!hasFavorites) return null;

  return (
    <FavoritesDropdownContent
      setOpenedIds={setOpenedIds}
      userFavorites={userFavorites}
      favoritesList={favoritesList}
    />
  );
});
FavoritesDropdown.displayName = 'FavoritesDropdown';

const FavoritesDropdownContent: React.FC<{
  setOpenedIds: (v: string[]) => void;
  userFavorites: BusterUserFavorite[];
  favoritesList: ReturnType<typeof createListItem>[];
}> = ({ setOpenedIds, userFavorites, favoritesList }) => {
  const params = useParams<{
    dashboardId: string;
    metricId: string;
    collectionId: string;
  }>();
  const currentRoute = useAppLayoutContextSelector((s) => s.currentRoute);

  const bulkEditFavorites = useUserConfigContextSelector((state) => state.bulkEditFavorites);
  const removeItemFromFavorite = useUserConfigContextSelector(
    (state) => state.removeItemFromFavorite
  );

  const selectedKey = useMemo(
    () => Object.values(params).find((v) => !!v) || currentRoute,
    [params, currentRoute]
  );

  const onOpenChange = useMemoizedFn((v: string[]) => {
    setOpenedIds(v);
  });

  const onChangeOrder = useMemoizedFn(
    (
      items: {
        value: string;
      }[]
    ) => {
      const newFavorites = items.map((item) => item?.value as string);
      if (newFavorites.length === items.length) bulkEditFavorites(newFavorites);
    }
  );

  const onDelete = useMemoizedFn(async (id: string) => {
    const item = userFavorites.find((item) => item.id === id);
    if (item) {
      await removeItemFromFavorite({
        id: item.id || item.collection_id!,
        asset_type: item.asset_type
      });
    }
  });

  return (
    <AppMenuGroupSingleSortable
      label="Favorites"
      items={favoritesList}
      selectedKey={selectedKey}
      onOpenChange={onOpenChange}
      onChangeOrder={onChangeOrder}
      onDelete={onDelete}
    />
  );
};

const createListItem = ({
  item,
  openedIds
}: {
  item: BusterUserFavorite;
  openedIds: string[];
}): {
  label: React.ReactNode;
  icon: React.ReactNode;
  children: any[] | null;
  key: string;
  value: string;
} => {
  let link = '';
  let icon = asset_typeToIcon(item.asset_type, {
    open: openedIds.includes(item.collection_id || '')
  });
  let name = item.name || item.collection_name;
  const assetType = item.asset_type;

  if (assetType === ShareAssetType.METRIC) {
    link = createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID,
      metricId: item.id
    });
  } else if (assetType === ShareAssetType.DASHBOARD) {
    link = createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID,
      dashboardId: item.id
    });
  } else if (assetType === ShareAssetType.COLLECTION) {
    link = createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId: item.collection_id!
    });
  }

  return {
    key: item.id || item.collection_id!,
    value: item.id || item.collection_id!,
    label: <Link href={link}>{name}</Link>,
    icon,
    children: null
  };
};
