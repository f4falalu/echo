'use client';

import React, { useMemo } from 'react';
import { Breadcrumb, Button } from 'antd';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import {
  useBusterCollectionListContextSelector,
  useCollectionIndividual,
  useCollectionLists
} from '@/context/Collections';
import { AppContentHeader, AppMaterialIcons, AppSegmented, AppTooltip } from '@/components/ui';
import { useHotkeys } from 'react-hotkeys-hook';
import { CollectionsListEmit } from '@/api/buster_socket/collections';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';

export const CollectionListHeader: React.FC<{
  collectionId?: string;
  setOpenNewCollectionModal: (open: boolean) => void;
}> = React.memo(({ collectionId, setOpenNewCollectionModal }) => {
  const onSetCollectionListFilters = useBusterCollectionListContextSelector(
    (x) => x.setCollectionListFilters
  );
  const collectionListFilters = useBusterCollectionListContextSelector(
    (x) => x.collectionListFilters
  );
  const collectionsList = useBusterCollectionListContextSelector((x) => x.collectionsList);
  const isCollectionListFetched = useBusterCollectionListContextSelector(
    (x) => x.isCollectionListFetched
  );
  const { collection } = useCollectionIndividual({ collectionId });

  const collectionTitle = collection?.name || 'Collections';

  const showFilters = useMemo(
    () =>
      (isCollectionListFetched && collectionsList?.length !== 0) ||
      !isEmpty(collectionsList) ||
      !isEmpty(omit(collectionListFilters, 'page', 'page_size')),
    [isCollectionListFetched, collectionsList?.length, collectionListFilters]
  );

  const breadcrumbItems = useMemo(
    () => [
      {
        title: (
          <Link
            suppressHydrationWarning
            href={
              collectionId
                ? createBusterRoute({
                    route: BusterRoutes.APP_COLLECTIONS_ID,
                    collectionId: collectionId
                  })
                : createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS })
            }>
            {collectionTitle}
          </Link>
        )
      }
    ],
    [collectionId, collectionTitle]
  );

  useHotkeys('n', () => {
    setOpenNewCollectionModal(true);
  });

  return (
    <>
      <AppContentHeader className="items-center justify-between space-x-2">
        <div className="flex space-x-1">
          <Breadcrumb className="flex items-center" items={breadcrumbItems} />
          {showFilters && (
            <CollectionFilters
              collectionListFilters={collectionListFilters}
              setCollectionListFilters={onSetCollectionListFilters}
            />
          )}
        </div>

        <div className="flex items-center">
          <AppTooltip title={'Create new collection'} shortcuts={['N']}>
            <Button
              type="default"
              icon={<AppMaterialIcons icon="add" />}
              onClick={() => setOpenNewCollectionModal(true)}>
              New Collection
            </Button>
          </AppTooltip>
        </div>
      </AppContentHeader>
    </>
  );
});
CollectionListHeader.displayName = 'CollectionListHeader';

const filters = [
  {
    label: 'All',
    value: JSON.stringify({})
  },
  {
    label: 'My collections',
    value: JSON.stringify({ owned_by_me: true })
  },
  {
    label: 'Shared with me',
    value: JSON.stringify({ shared_with_me: true })
  }
];

const CollectionFilters: React.FC<{
  setCollectionListFilters: ReturnType<typeof useCollectionLists>['setCollectionListFilters'];
  collectionListFilters?: Omit<CollectionsListEmit['payload'], 'page' | 'page_size'>;
}> = React.memo(({ setCollectionListFilters, collectionListFilters }) => {
  const value = useMemo(() => {
    const activeFiltersValue = JSON.stringify(collectionListFilters);
    return filters.find((f) => f.value === activeFiltersValue)?.value || filters[0].value;
  }, [filters, collectionListFilters]);

  const onChangeFilter = useMemoizedFn((v: SegmentedValue) => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(v as string);
    } catch (error) {
      console.error('error', error);
    }
    setCollectionListFilters(parsedValue);
  });

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented options={filters} value={value} onChange={onChangeFilter} />
    </div>
  );
});
CollectionFilters.displayName = 'CollectionFilters';
