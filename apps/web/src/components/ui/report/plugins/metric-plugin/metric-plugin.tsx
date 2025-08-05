import type { PluginConfig, TElement } from 'platejs';
import { createPlatePlugin, PlateElement, type PlateElementProps } from 'platejs/react';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { CUSTOM_KEYS } from '../../config/keys';

type MetricElementProps = PlateElementProps<TElement, PluginConfig<'metric', { metricId: string }>>;

const MetricElement = ({ children, ...props }: MetricElementProps) => {
  const { metricId } = props.getOptions();

  const { attributes, ...rest } = props;

  const content = metricId ? children : <MetricEmbedPlaceholder {...props} children={children} />;

  return (
    <PlateElement
      className="rounded-md"
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true
      }}
      {...rest}>
      {content}
    </PlateElement>
  );
};

export const MetricPlugin = createPlatePlugin({
  key: CUSTOM_KEYS.metric,
  api: {},
  options: {
    metricId: ''
  },
  node: {
    isElement: true,
    component: MetricElement
  }
});

export const TestMetricPlugin = createPlatePlugin({
  key: 'test-metric',
  api: {},
  options: {},
  node: {
    component: (props) => {
      return <div>Test Metric</div>;
    }
  }
});
