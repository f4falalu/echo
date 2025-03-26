import {
  useDeleteMetric,
  useGetMetric,
  useGetMetricData,
  useRemoveMetricFromCollection,
  useSaveMetricToCollections,
  useUpdateMetric
} from '@/api/buster_rest/metrics';
import {
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard
} from '@/api/buster_rest/dashboards';
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
import { downloadElementToImage, exportJSONToCSV } from '@/lib/exportUtils';
import { METRIC_CHART_CONTAINER_ID } from '@/controllers/MetricController/MetricViewChart/config';
import { timeout } from '@/lib';
import { METRIC_CHART_TITLE_INPUT_ID } from '@/controllers/MetricController/MetricViewChart/MetricViewChartHeader';
import { ShareMenuContent } from '@/components/features/ShareMenu/ShareMenuContent';
import { canEdit, getIsEffectiveOwner, getIsOwner } from '@/lib/share';
import { getShareAssetConfig } from '@/components/features/ShareMenu/helpers';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export const ThreeDotMenuButton = React.memo(({ metricId }: { metricId: string }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const { data: permission } = useGetMetric({ id: metricId }, (x) => x.permission);
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

  const isEditor = canEdit(permission);
  const isOwnerEffective = getIsEffectiveOwner(permission);
  const isOwner = getIsOwner(permission);

  const items: DropdownItems = useMemo(
    () =>
      [
        isOwnerEffective && shareMenu,
        isEditor && statusSelectMenu,
        { type: 'divider' },
        dashboardSelectMenu,
        collectionSelectMenu,
        favoriteMetric,
        { type: 'divider' },
        isEditor && editChartMenu,
        resultsViewMenu,
        sqlEditorMenu,
        isEditor && versionHistoryItems,
        { type: 'divider' },
        downloadCSVMenu,
        downloadPNGMenu,
        { type: 'divider' },
        isEditor && renameMetricMenu,
        isOwner && deleteMetricMenu
      ].filter(Boolean) as DropdownItems,
    [
      isEditor,
      isOwner,
      isOwnerEffective,
      renameMetricMenu,
      dashboardSelectMenu,
      deleteMetricMenu,
      downloadCSVMenu,
      downloadPNGMenu,
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
    <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
      <Button prefix={<Dots />} variant="ghost" />
    </Dropdown>
  );
});
ThreeDotMenuButton.displayName = 'ThreeDotMenuButton';

const useDashboardSelectMenu = ({ metricId }: { metricId: string }) => {
  const { mutateAsync: saveMetricsToDashboard } = useAddMetricsToDashboard();
  const { mutateAsync: removeMetricsFromDashboard } = useRemoveMetricsFromDashboard();
  const { data: dashboards } = useGetMetric({ id: metricId }, (x) => x.dashboards);

  const onSaveToDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        saveMetricsToDashboard({ metricIds: [metricId], dashboardId })
      )
    );
  });

  const onRemoveFromDashboard = useMemoizedFn(async (dashboardIds: string[]) => {
    await Promise.all(
      dashboardIds.map((dashboardId) =>
        removeMetricsFromDashboard({ metricIds: [metricId], dashboardId })
      )
    );
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
  const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
  const { data } = useGetMetric({ id: metricId }, (x) => ({
    versions: x.versions,
    version_number: x.version_number
  }));
  const { versions = [], version_number } = data || {};

  const onClickVersionHistory = useMemoizedFn((versionNumber: number) => {
    onChangeQueryParams({ metric_version_number: versionNumber.toString() });
  });

  const versionHistoryItems: DropdownItems = useMemo(() => {
    return versions.map((x) => ({
      label: `Version ${x.version_number}`,
      secondaryLabel: timeFromNow(x.updated_at, false),
      value: x.version_number.toString(),
      selected: x.version_number === version_number,
      onClick: () => onClickVersionHistory(x.version_number)
    }));
  }, [versions, version_number, onClickVersionHistory]);

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
  const { mutateAsync: saveMetricToCollection } = useSaveMetricToCollections();
  const { mutateAsync: removeMetricFromCollection } = useRemoveMetricFromCollection();
  const { data: collections } = useGetMetric({ id: metricId }, (x) => x.collections);
  const { openInfoMessage } = useBusterNotifications();

  const selectedCollections = useMemo(() => {
    return collections?.map((x) => x.id) || [];
  }, [collections]);

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveMetricToCollection({
      metricIds: [metricId],
      collectionIds
    });
    openInfoMessage('Metrics saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeMetricFromCollection({
      metricIds: [metricId],
      collectionIds: [collectionId]
    });
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
  const { data: metricStatus } = useGetMetric({ id: metricId }, (x) => x.status);
  const { mutateAsync: updateMetric } = useUpdateMetric();

  const onChangeStatus = useMemoizedFn(async (status: VerificationStatus) => {
    await updateMetric({ id: metricId, status });
  });

  const dropdownProps = useStatusDropdownContent({
    isAdmin: true,
    selectedStatus: metricStatus || VerificationStatus.NOT_REQUESTED,
    onChangeStatus
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  const statusDropdownItem: DropdownItem = useMemo(
    () => ({
      label: 'Status',
      value: 'status',
      icon: <StatusBadgeIndicator status={metricStatus || VerificationStatus.NOT_REQUESTED} />,
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>]
    }),
    [statusSubMenu]
  );

  return statusDropdownItem;
};

const useFavoriteMetricSelectMenu = ({ metricId }: { metricId: string }) => {
  const { data: name } = useGetMetric({ id: metricId }, (x) => x.name);
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: metricId,
    type: ShareAssetType.METRIC,
    name: name || ''
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
  const { data: name } = useGetMetric({ id: metricId }, (x) => x.name);

  return useMemo(
    () => ({
      label: 'Download as CSV',
      value: 'download-csv',
      icon: <Download4 />,
      loading: isDownloading,
      onClick: async () => {
        const data = metricData?.data;
        if (data && name) {
          setIsDownloading(true);
          await exportJSONToCSV(data, name);
          setIsDownloading(false);
        }
      }
    }),
    [metricData, isDownloading, name]
  );
};

const useDownloadPNGSelectMenu = ({ metricId }: { metricId: string }) => {
  const { openErrorMessage } = useBusterNotifications();
  const { data: name } = useGetMetric({ id: metricId }, (x) => x.name);
  const { data: selectedChartType } = useGetMetric(
    { id: metricId },
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
            return await downloadElementToImage(node, `${name}.png`);
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
  const { data: metric } = useGetMetric({ id: metricId }, getShareAssetConfig);

  return useMemo(
    () => ({
      label: 'Share metric',
      value: 'share-metric',
      icon: <ShareRight />,

      items: (
        <ShareMenuContent
          key={metricId}
          shareAssetConfig={metric!}
          assetId={metricId}
          assetType={ShareAssetType.METRIC}
        />
      )
    }),
    [metricId]
  );
};
