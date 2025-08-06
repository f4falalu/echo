import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { PopoverAnchor, PopoverBase, PopoverContent } from '@/components/ui/popover';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useClickAway } from '@/hooks/useClickAway';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';
import { useEditorRef, useFocused, useReadOnly, useSelected, useElement } from 'platejs/react';
import React, { useEffect } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { AddMetricModal } from '@/components/features/modal/AddMetricModal';
import { MetricPlugin, type TMetricElement } from '../../plugins/metric-plugin';

export const MetricEmbedPlaceholder: React.FC = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const isOpenPopover = focused && selected && !readOnly;

  const onOpenAddMetricModal = useMemoizedFn(() => {
    setOpenModal(true);
  });

  const onCloseAddMetricModal = useMemoizedFn(() => {
    setOpenModal(false);
  });

  useEffect(() => {
    if (isOpenPopover) {
      onOpenAddMetricModal();
    }
  }, [isOpenPopover]);

  return (
    <>
      <div className="media-embed py-2.5">
        <div
          ref={anchorRef}
          onClick={onOpenAddMetricModal}
          className={cn(
            'bg-muted hover:bg-primary/10 flex cursor-pointer items-center rounded-sm p-3 pr-9 select-none'
          )}
          contentEditable={false}>
          <div className="text-muted-foreground/80 relative mr-3 flex [&_svg]:size-6">
            <ASSET_ICONS.metrics />
          </div>

          <div className="text-muted-foreground text-sm whitespace-nowrap">Add a metric</div>
        </div>
      </div>

      <MemoizedAddMetricModal openModal={openModal} onCloseAddMetricModal={onCloseAddMetricModal} />
    </>
  );
};

const EMPTY_SELECTED_METRICS: {
  id: string;
  name: string;
}[] = [];

const MemoizedAddMetricModal = React.memo(
  ({
    openModal,
    onCloseAddMetricModal
  }: {
    openModal: boolean;
    onCloseAddMetricModal: () => void;
  }) => {
    const editor = useEditorRef();
    const element = useElement<TMetricElement>();
    const { openInfoMessage } = useBusterNotifications();

    const onAddMetric = useMemoizedFn(async (metrics: { id: string; name: string }[]) => {
      const selectedMetricId = metrics[0].id;
      if (!selectedMetricId) {
        openInfoMessage('No metric selected');
        return;
      }
      if (metrics.length > 1) {
        openInfoMessage('Multiple metrics selected, only the first one will be used');
      }

      const plugin = editor.getPlugin(MetricPlugin);
      const at = editor.api.findPath(element);

      if (!at) {
        openInfoMessage('No metric element found');
        return;
      }

      //    editor.tf.setNodes<TMetricElement>({ metricId: selectedMetricId }, { at });

      plugin.api.updateMetric(selectedMetricId);

      // Close the modal after successful selection
      onCloseAddMetricModal();
    });

    return (
      <AddMetricModal
        open={openModal}
        loading={false}
        selectedMetrics={EMPTY_SELECTED_METRICS}
        onClose={onCloseAddMetricModal}
        onAddMetrics={onAddMetric}
      />
    );
  }
);
