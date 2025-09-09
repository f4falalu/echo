import {
  SlateElement,
  type SlateElementProps,
  type TCaptionProps,
  type TResizableProps,
} from 'platejs';
import type { TMetricElement } from '../../plugins/metric-kit';
import { MetricContent } from './MetricContent';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';

export const MetricElementStatic = (
  props: SlateElementProps<TMetricElement & TCaptionProps & TResizableProps>
) => {
  const metricId = props.element.metricId;
  const metricVersionNumber = props.element.metricVersionNumber;
  const readOnly = true;
  const { align = 'center', caption, url, width } = props.element;

  const content = metricId ? (
    <MetricContent
      metricId={metricId}
      metricVersionNumber={metricVersionNumber}
      readOnly={readOnly}
    />
  ) : (
    <MetricEmbedPlaceholder />
  );

  return (
    <SlateElement {...props} className="mt-2.5 mb-4.5">
      <figure className="group relative m-0 inline-block" style={{ width }}>
        <div className="relative max-w-full min-w-[92px]" style={{ textAlign: align }}>
          {content}
        </div>
        <div className="h-0">{props.children}</div>
      </figure>
    </SlateElement>
  );
};
