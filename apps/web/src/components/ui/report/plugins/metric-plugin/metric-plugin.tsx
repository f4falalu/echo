import type { PluginConfig, TElement } from 'platejs';
import { createPlatePlugin, PlateElement, type PlateElementProps } from 'platejs/react';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { CUSTOM_KEYS } from '../../config/keys';
import { useState, useEffect } from 'react';
import { AddMetricModal } from '@/components/features/modal/AddMetricModal';

type MetricElementProps = PlateElementProps<
  TElement,
  PluginConfig<
    'metric',
    { metricId: string; openModal: boolean },
    {
      openAddMetricModal: () => void;
      closeAddMetricModal: () => void;
    }
  >
>;

const MetricElement = ({ children, ...props }: MetricElementProps) => {
  const [openModal, setOpenModal] = useState(false);
  const { metricId } = props.getOptions();
  const { editor, plugin } = props;

  // Subscribe to global modal state
  useEffect(() => {
    console.log(editor);
    plugin.api.openAddMetricModal = () => {
      setOpenModal(true);
    };
    plugin.api.closeAddMetricModal = () => {
      setOpenModal(false);
    };

    // const unsubscribe = modalState.subscribe(() => {
    //   setOpenModal(modalState.isOpen);
    // });
    // return () => {
    //   unsubscribe();
    // };
  }, []);

  const { attributes, ...rest } = props;

  const content = metricId ? children : <MetricEmbedPlaceholder metricId={metricId} />;

  return (
    <PlateElement
      className="rounded-md"
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true
      }}
      {...rest}>
      {content}

      <AddMetricModal
        open={openModal}
        loading={false}
        selectedMetrics={[]}
        onClose={() => {
          // modalState.close();
        }}
        onAddMetrics={async (v) => {
          // Handle adding metrics here
          //  modalState.close();
        }}
      />
    </PlateElement>
  );
};

export const MetricPlugin = createPlatePlugin({
  key: CUSTOM_KEYS.metric,
  options: {
    metricId: '',
    openModal: false
  },
  render: {},
  api: {
    openAddMetricModal: () => {
      //temp until we mount the component and override the api
    },
    closeAddMetricModal: () => {
      //temp until we mount the component and override the api
    }
  },
  node: {
    isElement: true,
    component: MetricElement
  }
});
