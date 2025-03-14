import {
  useDeleteMetric,
  useGetMetric,
  useRemoveMetricFromCollection,
  useRemoveMetricFromDashboard,
  useSaveMetricToCollection,
  useSaveMetricToDashboard
} from '@/api/buster_rest/metrics';
import { DropdownContent, DropdownItem, DropdownItems } from '@/components/ui/dropdown';
import {
  Trash,
  Dots,
  Pencil,
  SquareChart,
  Download4,
  History,
  SquareCode,
  Table,
  SquareChartPen,
  Star,
  ShareRight
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
import { StatusNotRequestedIcon } from '@/assets';
import { useSaveToDashboardDropdownContent } from '@/components/features/dropdowns/SaveToDashboardDropdown';
import { useMemoizedFn } from '@/hooks';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';

export const ThreeDotMenuButton = React.memo(({ metricId }: { metricId: string }) => {
  const { mutateAsync: deleteMetric, isPending: isDeletingMetric } = useDeleteMetric();
  const { openSuccessMessage } = useBusterNotifications();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);

  const dashboardSelectMenu = useDashboardSelectMenu({ metricId });
  const versionHistoryItems = useVersionHistoryItems({ metricId });
  const collectionSelectMenu = useCollectionSelectMenu({ metricId });

  const items: DropdownItems = useMemo(
    () => [
      {
        label: 'Share',
        value: 'share',
        icon: <ShareRight />,
        items: [],
        onClick: () => {
          console.log('share metric');
        }
      },
      {
        label: 'Request verification',
        value: 'request-verification',
        icon: <StatusNotRequestedIcon />,
        items: [],
        onClick: () => {
          console.log('share metric');
        }
      },
      { type: 'divider' },
      dashboardSelectMenu,
      collectionSelectMenu,
      {
        label: 'Add to favorites',
        value: 'add-to-favorites',
        icon: <Star />,
        onClick: () => {
          console.log('add to favorites');
        }
      },
      { type: 'divider' },
      {
        label: 'Edit chart',
        value: 'edit-chart',
        icon: <SquareChartPen />,
        onClick: () => {
          console.log('edit chart');
        }
      },
      {
        label: 'Results view',
        value: 'results-view',
        icon: <Table />,
        onClick: () => {
          console.log('results view');
        }
      },
      {
        label: 'SQL Editor',
        value: 'sql-editor',
        icon: <SquareCode />,
        onClick: () => {
          console.log('sql editor');
        },
        versionHistoryItems
      },

      { type: 'divider' },
      {
        label: 'Download as CSV',
        value: 'download-csv',
        icon: <Download4 />,
        onClick: () => {
          console.log('download csv');
        }
      },
      {
        label: 'Download as PNG',
        value: 'download-png',
        icon: <SquareChart />,
        onClick: () => {
          console.log('download png');
        }
      },
      { type: 'divider' },
      {
        label: 'Rename metric',
        value: 'rename',
        icon: <Pencil />,
        onClick: () => {
          console.log('rename');
        }
      },
      {
        label: 'Delete metric',
        value: 'delete',
        icon: <Trash />,
        loading: isDeletingMetric,
        onClick: async () => {
          await deleteMetric({ ids: [metricId] });
          openSuccessMessage('Metric deleted');
          onSetSelectedFile(null);
        }
      }
    ],
    [
      dashboardSelectMenu,
      deleteMetric,
      isDeletingMetric,
      metricId,
      openSuccessMessage,
      onSetSelectedFile,
      versionHistoryItems
    ]
  );

  return (
    <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit">
      <Button prefix={<Dots />} variant="ghost" />
    </Dropdown>
  );
});
ThreeDotMenuButton.displayName = 'ThreeDotMenuButton';

const useDashboardSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricToDashboard } = useSaveMetricToDashboard();
  const { mutateAsync: removeMetricFromDashboard } = useRemoveMetricFromDashboard();
  const { data: dashboards } = useGetMetric(metricId, (x) => x.dashboards);

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await saveMetricToDashboard({ metricId, dashboardIds });
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardId: string) => {
    await removeMetricFromDashboard({ metricId, dashboardId });
  });

  const { items, footerContent, selectType, menuHeader } = useSaveToDashboardDropdownContent({
    onSaveToDashboard,
    onRemoveFromDashboard,
    selectedDashboards: dashboards || []
  });

  const dashboardSubMenu = useMemo(() => {
    return (
      <DropdownContent
        menuHeader={menuHeader}
        selectType={selectType}
        items={items}
        footerContent={footerContent}
      />
    );
  }, [items, footerContent, menuHeader, selectType]);

  const dashboardDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Add to dashboard',
      value: 'add-to-dashboard',
      icon: <ASSET_ICONS.dashboardAdd />,
      items: [<React.Fragment key="dashboard-sub-menu">{dashboardSubMenu}</React.Fragment>],
      onClick: () => {
        console.log('add to dashboard');
      }
    }),
    [dashboardSubMenu]
  );

  return dashboardDropdownItem;
};

const useVersionHistoryItems = ({ metricId }: { metricId: string }) => {
  const { data } = useGetMetric(metricId, (x) => ({
    versions: x.versions,
    version_number: x.version_number
  }));
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: DropdownItems = useMemo(() => {
    return versions.map((x) => ({
      label: `Version ${x.version_number}`,
      secondaryLabel: timeFromNow(x.updated_at, false),
      value: x.version_number.toString(),
      selected: x.version_number === version_number,
      onClick: () => {
        console.log('version history', x.version_number);
      }
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

const useCollectionSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollection();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  const { data: collections } = useGetMetric(metricId, (x) => x.collections);
  const { openInfoMessage } = useBusterNotifications();

  const selectedCollections = useMemo(() => {
    return collections?.map((x) => x.id) || [];
  }, [collections]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveMetricToCollection({
      metricId,
      collectionIds
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeMetricFromCollection({ metricId, collectionId });
    openInfoMessage('Metrics removed from collections');
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
      ],
      onClick: () => {
        console.log('add to collection');
      }
    }),
    [collectionSubMenu]
  );

  return collectionDropdownItem;
};
