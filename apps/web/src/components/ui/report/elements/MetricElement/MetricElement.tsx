'use client';

import { PlateElement, type PlateElementProps, withHOC } from 'platejs/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { Caption, CaptionTextarea } from '../CaptionNode';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from '../ResizeHandle';
import { type TMetricElement } from '../../plugins/metric-plugin';
import React from 'react';

type MetricElementProps = PlateElementProps<TMetricElement>;

export const MetricElement = withHOC(
  ResizableProvider,
  function MetricElement({ children, ...props }: MetricElementProps) {
    const metricId = props.element.metricId;

    const { attributes, ...elementProps } = props;

    const content = metricId ? <MetricContent metricId={metricId} /> : <MetricEmbedPlaceholder />;

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

const MetricContent = React.memo(({ metricId }: { metricId: string }) => {
  const width = useResizableValue('width');
  const align = 'center'; // Default align for metrics
  return (
    <figure className="group relative m-0 w-full cursor-default" contentEditable={false}>
      <Resizable
        align={align}
        options={{
          align,
          maxWidth: '100%',
          minWidth: 350
        }}>
        <ResizeHandle
          className={mediaResizeHandleVariants({ direction: 'left' })}
          options={{ direction: 'left' }}
        />

        {/* Metric content placeholder - replace with actual metric rendering */}
        <div className="min-h-60 rounded bg-red-100 p-4">
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
  );
});
