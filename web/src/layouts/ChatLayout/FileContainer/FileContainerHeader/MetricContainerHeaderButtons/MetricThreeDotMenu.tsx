import {
  useDeleteMetric,
  useGetMetric,
  useGetMetricData,
  useRemoveMetricFromCollection,
  useRemoveMetricFromDashboard,
  useSaveMetricToCollection,
  useSaveMetricToDashboard,
  useUpdateMetric
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
  SquareChartPen,
  Star,
  ShareRight
} from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useBusterNotifications } from '@/context/BusterNotifications';
import {
  MetricFileViewSecondary,
  useChatLayoutContextSelector
} from '@/layouts/ChatLayout/ChatLayoutContext';
import { useMemo, useState } from 'react';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import React from 'react';
import { timeFromNow } from '@/lib/date';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { useSaveToDashboardDropdownContent } from '@/components/features/dropdowns/SaveToDashboardDropdown';
import { useMemoizedFn } from '@/hooks';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { ShareAssetType, VerificationStatus } from '@/api/asset_interfaces/share';
import { useStatusDropdownContent } from '@/components/features/metrics/StatusBadgeIndicator/StatusDropdownContent';
import { StatusBadgeIndicator } from '@/components/features/metrics/StatusBadgeIndicator';
import { useFavoriteStar } from '@/components/features/list/FavoriteStar';
import { downloadElementToImage, exportElementToImage, exportJSONToCSV } from '@/lib/exportUtils';
import { METRIC_CHART_CONTAINER_ID } from '@/controllers/MetricController/MetricViewChart/config';
import { timeout } from '@/lib';
import { METRIC_CHART_TITLE_INPUT_ID } from '@/controllers/MetricController/MetricViewChart/MetricViewChartHeader';

export const ThreeDotMenuButton = React.memo(({ metricId }: { metricId: string }) => {
  const { mutateAsync: deleteMetric, isPending: isDeletingMetric } = useDeleteMetric();
  const { openSuccessMessage } = useBusterNotifications();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);

  const dashboardSelectMenu = useDashboardSelectMenu({ metricId });
  const versionHistoryItems = useVersionHistorySelectMenu({ metricId });
  const collectionSelectMenu = useCollectionSelectMenu({ metricId });
  const statusSelectMenu = useStatusSelectMenu({ metricId });
  const favoriteMetric = useFavoriteMetricSelectMenu({ metricId });
  const editChartMenu = useEditChartSelectMenu();
  const resultsViewMenu = useResultsViewSelectMenu();
  const sqlEditorMenu = useSQLEditorSelectMenu();
  const downloadCSVMenu = useDownloadCSVSelectMenu({ metricId });
  const downloadPNGMenu = useDownloadPNGSelectMenu({ metricId });
  const deleteMetricMenu = useDeleteMetricSelectMenu({ metricId });
  const renameMetricMenu = useRenameMetricSelectMenu({ metricId });
  const shareMenu = useShareMenuSelectMenu({ metricId });

  const items: DropdownItems = useMemo(
    () => [
      shareMenu,
      statusSelectMenu,
      { type: 'divider' },
      dashboardSelectMenu,
      collectionSelectMenu,
      favoriteMetric,
      { type: 'divider' },
      editChartMenu,
      resultsViewMenu,
      sqlEditorMenu,
      { type: 'divider' },
      downloadCSVMenu,
      downloadPNGMenu,
      { type: 'divider' },
      renameMetricMenu,
      deleteMetricMenu
    ],
    [
      renameMetricMenu,
      dashboardSelectMenu,
      deleteMetricMenu,
      downloadCSVMenu,
      downloadPNGMenu,
      isDeletingMetric,
      metricId,
      openSuccessMessage,
      onSetSelectedFile,
      versionHistoryItems,
      favoriteMetric,
      statusSelectMenu,
      collectionSelectMenu,
      editChartMenu,
      resultsViewMenu,
      sqlEditorMenu,
      shareMenu
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
      items: [<React.Fragment key="dashboard-sub-menu">{dashboardSubMenu}</React.Fragment>]
    }),
    [dashboardSubMenu]
  );

  return dashboardDropdownItem;
};

const useVersionHistorySelectMenu = ({ metricId }: { metricId: string }) => {
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
      ]
    }),
    [collectionSubMenu]
  );

  return collectionDropdownItem;
};

const useStatusSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: metric } = useGetMetric(metricId, (x) => x);
  const { mutateAsync: updateMetric } = useUpdateMetric();

  const onChangeStatus = useMemoizedFn(async (status: VerificationStatus) => {
    await updateMetric({ id: metricId, status });
  });

  const dropdownProps = useStatusDropdownContent({
    isAdmin: true,
    selectedStatus: metric?.status || VerificationStatus.NOT_REQUESTED,
    onChangeStatus
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const statusDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Status',
      value: 'status',
      icon: <StatusBadgeIndicator status={metric?.status || VerificationStatus.NOT_REQUESTED} />,
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>]
    }),
    [statusSubMenu]
  );

  return statusDropdownItem;
};

const useFavoriteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: title } = useGetMetric(metricId, (x) => x.title);
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: metricId,
    type: ShareAssetType.METRIC,
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

const useEditChartSelectMenu = () => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const editableSecondaryView: MetricFileViewSecondary = 'chart-edit';
  const onClickButton = useMemoizedFn(() => {
    onSetFileView({ secondaryView: editableSecondaryView, fileView: 'chart' });
  });
  return useMemo(
    () => ({
      label: 'Edit chart',
      value: 'edit-chart',
      onClick: onClickButton,
      icon: <SquareChartPen />
    }),
    []
  );
};

const useResultsViewSelectMenu = () => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

  const onClickButton = useMemoizedFn(() => {
    onSetFileView({ secondaryView: null, fileView: 'results' });
  });

  return useMemo(
    () => ({
      label: 'Results view',
      value: 'results-view',
      onClick: onClickButton,
      icon: <SquareChartPen />
    }),
    []
  );
};

const useSQLEditorSelectMenu = () => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  const editableSecondaryView: MetricFileViewSecondary = 'sql-edit';

  const onClickButton = useMemoizedFn(() => {
    onSetFileView({ secondaryView: editableSecondaryView, fileView: 'results' });
  });

  return useMemo(
    () => ({
      label: 'SQL Editor',
      value: 'sql-editor',
      onClick: onClickButton,
      icon: <SquareCode />
    }),
    [onClickButton]
  );
};

const useDownloadCSVSelectMenu = ({ metricId }: { metricId: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: metricData } = useGetMetricData({ id: metricId });
  const { data: title } = useGetMetric(metricId, (x) => x.title);

  return useMemo(
    () => ({
      label: 'Download as CSV',
      value: 'download-csv',
      icon: <Download4 />,
      loading: isDownloading,
      onClick: async () => {
        const data = metricData?.data;
        if (data && title) {
          setIsDownloading(true);
          await exportJSONToCSV(data, title);
          setIsDownloading(false);
        }
      }
    }),
    [metricData, isDownloading, title]
  );
};

const useDownloadPNGSelectMenu = ({ metricId }: { metricId: string }) => {
  const { openSuccessMessage, openErrorMessage } = useBusterNotifications();
  const { data: title } = useGetMetric(metricId, (x) => x.title);
  const { data: selectedChartType } = useGetMetric(
    metricId,
    (x) => x.chart_config?.selectedChartType
  );

  const canDownload = selectedChartType && selectedChartType !== 'table';

  return useMemo(
    () => ({
      label: 'Download as PNG',
      value: 'download-png',
      disabled: !canDownload,
      icon: <SquareChart />,
      onClick: async () => {
        const node = document.getElementById(METRIC_CHART_CONTAINER_ID(metricId)) as HTMLElement;
        if (node) {
          try {
            return await downloadElementToImage(node, `${title}.png`);
          } catch (error) {
            console.error(error);
          }
        }

        openErrorMessage('Failed to download PNG');
      }
    }),
    [canDownload]
  );
};

const useDeleteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: deleteMetric } = useDeleteMetric();

  return useMemo(
    () => ({
      label: 'Delete metric',
      value: 'delete-metric',
      icon: <Trash />,
      onClick: async () => {
        await deleteMetric({ ids: [metricId] });
      }
    }),
    [metricId]
  );
};

const useRenameMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);
  return useMemo(
    () => ({
      label: 'Rename metric',
      value: 'rename-metric',
      icon: <Pencil />,
      onClick: async () => {
        onSetFileView({ fileView: 'chart' });
        await timeout(125);
        const input = document.getElementById(METRIC_CHART_TITLE_INPUT_ID) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }),
    [metricId]
  );
};

export const useShareMenuSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: updateMetric } = useUpdateMetric();

  return useMemo(
    () => ({
      label: 'Share metric',
      value: 'share-metric',
      icon: <ShareRight />,
      items: [<div className="bg-red-200 p-2">SWAG</div>]
    }),
    [metricId]
  );
};
