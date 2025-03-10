'use client';

import React, { useMemo } from 'react';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { BusterRoutes } from '@/routes';
import {
  useBusterCollectionListContextSelector,
  useCollectionIndividual,
  useCollectionLists
} from '@/context/Collections';
import { AppTooltip } from '@/components/ui/tooltip';
import { AppSegmented } from '@/components/ui/segmented';
import { useHotkeys } from 'react-hotkeys-hook';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { useMemoizedFn } from '@/hooks';
import { type SegmentedItem } from '@/components/ui/segmented';
import { Plus } from '@/components/ui/icons';
import { GetCollectionListParams } from '@/api/request_interfaces/collections';

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

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: collectionTitle,
        route: collectionId
          ? {
              route: BusterRoutes.APP_COLLECTIONS_ID,
              collectionId: collectionId
            }
          : { route: BusterRoutes.APP_COLLECTIONS }
      }
    ],
    [collectionId, collectionTitle]
  );

  useHotkeys('n', () => {
    setOpenNewCollectionModal(true);
  });

  return (
    <>
      <div className="flex space-x-1">
        <Breadcrumb items={breadcrumbItems} />
        {showFilters && (
          <CollectionFilters
            collectionListFilters={collectionListFilters}
            setCollectionListFilters={onSetCollectionListFilters}
          />
        )}
      </div>

      <div className="flex items-center">
        <AppTooltip title={'Create new collection'} shortcuts={['N']}>
          <Button prefix={<Plus />} onClick={() => setOpenNewCollectionModal(true)}>
            New Collection
          </Button>
        </AppTooltip>
      </div>
    </>
  );
});
CollectionListHeader.displayName = 'CollectionListHeader';

const filters: SegmentedItem<string>[] = [
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
  collectionListFilters?: Omit<GetCollectionListParams, 'page' | 'page_size'>;
}> = React.memo(({ setCollectionListFilters, collectionListFilters }) => {
  const value = useMemo(() => {
    const activeFiltersValue = JSON.stringify(collectionListFilters);
    return filters.find((f) => f.value === activeFiltersValue)?.value || filters[0].value;
  }, [filters, collectionListFilters]);

  const onChangeFilter = useMemoizedFn((v: SegmentedItem) => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(v.value as string);
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
