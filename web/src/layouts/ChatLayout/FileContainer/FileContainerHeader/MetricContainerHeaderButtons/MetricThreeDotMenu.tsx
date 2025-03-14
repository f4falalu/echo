import { useDeleteMetric, useGetMetric } from '@/api/buster_rest/metrics';
import { DropdownItems } from '@/components/ui/dropdown';
import { Trash, Dots, Pencil, Chart, SquareChart, Download4, History } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { useMemo } from 'react';
import { Dropdown } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import React from 'react';
import { timeFromNow } from '@/lib/date';

export const ThreeDotMenuButton = React.memo(({ metricId }: { metricId: string }) => {
  const { mutateAsync: deleteMetric, isPending: isDeletingMetric } = useDeleteMetric();
  const { openSuccessMessage } = useBusterNotifications();
  const onSetSelectedFile = useChatLayoutContextSelector((x) => x.onSetSelectedFile);
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

  const items: DropdownItems = useMemo(
    () => [
      {
        label: 'Version history',
        value: 'version-history',
        icon: <History />,
        items: versionHistoryItems
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
      deleteMetric,
      isDeletingMetric,
      metricId,
      openSuccessMessage,
      onSetSelectedFile,
      versionHistoryItems
    ]
  );

  return (
    <Dropdown items={items} side="bottom" align="end">
      <Button prefix={<Dots />} variant="ghost" />
    </Dropdown>
  );
});
ThreeDotMenuButton.displayName = 'ThreeDotMenuButton';
