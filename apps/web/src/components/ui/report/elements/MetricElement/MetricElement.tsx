'use client';

import { PlateElement, type PlateElementProps, withHOC } from 'platejs/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { Caption, CaptionTextarea } from '../CaptionNode';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from '../ResizeHandle';
import { type TMetricElement } from '../../plugins/metric-plugin';

type MetricElementProps = PlateElementProps<TMetricElement>;

export const MetricElement = withHOC(
  ResizableProvider,
  function MetricElement({ children, ...props }: MetricElementProps) {
    const width = useResizableValue('width');
    const align = 'center'; // Default align for metrics
    const metricId = props.element.metricId;

    const { attributes, ...elementProps } = props;

    const content = metricId ? (
      <figure className="group relative m-0 w-full cursor-default" contentEditable={false}>
        <Resizable
          align={align}
          options={{
            align,
            maxWidth: '100%',
            minWidth: 200
          }}>
          <ResizeHandle
            className={mediaResizeHandleVariants({ direction: 'left' })}
            options={{ direction: 'left' }}
          />

          {/* Metric content placeholder - replace with actual metric rendering */}
          <div className="min-h-40 rounded bg-red-100 p-4">
            <div className="text-sm text-red-500">Metric: {metricId}</div>
          </div>

          <ResizeHandle
            className={mediaResizeHandleVariants({ direction: 'right' })}
            options={{ direction: 'right' }}
          />
        </Resizable>

        <Caption style={{ width }} align={align}>
          <CaptionTextarea placeholder="Write a caption..." />
        </Caption>
      </figure>
    ) : (
      <MetricEmbedPlaceholder />
    );

    return (
      <PlateElement
        className="rounded-md"
        attributes={{
          ...attributes,
          'data-plate-open-context-menu': true
        }}
        {...elementProps}>
        {content}
      </PlateElement>
    );
  }
);
