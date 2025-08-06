import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/utils';
import {
  useEditorRef,
  useReadOnly,
  useElement,
  usePluginOption,
  type PlateEditor,
  useSelected,
  useFocused
} from 'platejs/react';
import React, { useEffect } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { AddMetricModal } from '@/components/features/modal/AddMetricModal';
import { MetricPlugin, type TMetricElement } from '../../plugins/metric-plugin';

export const MetricEmbedPlaceholder: React.FC = () => {
  const [openModal, setOpenModal] = React.useState(false);
  const editor = useEditorRef();
  const plugin = editor.getPlugin(MetricPlugin);
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();
  const element = useElement<TMetricElement>();

  // Use usePluginOption to make the component reactive to plugin option changes
  const openMetricModal = usePluginOption(plugin, 'openMetricModal');

  const isOpenModalFromPlugin = openMetricModal && !readOnly;

  const onOpenAddMetricModal = useMemoizedFn(() => {
    setOpenModal(true);
    editor.tf.select();
  });

  const onCloseAddMetricModal = useMemoizedFn(() => {
    setOpenModal(false);
    plugin.api.metric.closeAddMetricModal();
  });

  useEffect(() => {
    if (isOpenModalFromPlugin) {
      onOpenAddMetricModal();
    }
  }, [isOpenModalFromPlugin, onOpenAddMetricModal]);

  return (
    <>
      <div className={cn('metric-placeholder py-2.5')}>
        <div
          onClick={onOpenAddMetricModal}
          className={cn(
            'bg-muted hover:bg-primary/10 flex cursor-pointer items-center rounded-sm p-3 pr-9 select-none',
            {
              'shadow-md': focused && selected
            }
          )}
          contentEditable={false}>
          <div className="text-muted-foreground/80 relative mr-3 flex [&_svg]:size-6">
            <ASSET_ICONS.metrics />
          </div>

          <div className="text-muted-foreground text-sm whitespace-nowrap">Add a metric</div>
        </div>
      </div>

      <MemoizedAddMetricModal
        plugin={plugin}
        editor={editor}
        element={element}
        openModal={openModal}
        onCloseAddMetricModal={onCloseAddMetricModal}
      />
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
    plugin,
    editor,
    element,
    onCloseAddMetricModal
  }: {
    openModal: boolean;
    onCloseAddMetricModal: () => void;
    plugin: typeof MetricPlugin;
    editor: PlateEditor;
    element: TMetricElement;
  }) => {
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

      const at = editor.api.findPath(element);

      if (!at) {
        openInfoMessage('No metric element found');
        alert('No metric element found');
        return;
      }

      plugin.api.metric.updateMetric(selectedMetricId, { at });

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
        selectionMode="single"
      />
    );
  }
);
