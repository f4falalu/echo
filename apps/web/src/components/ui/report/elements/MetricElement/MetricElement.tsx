'use client';

import type { PluginConfig, TElement } from 'platejs';
import {
  PlateElement,
  type PlateElementProps,
  withHOC,
  useFocused,
  useSelected
} from 'platejs/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { cn } from '@/lib/utils';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { Caption, CaptionTextarea } from '../CaptionNode';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from '../ResizeHandle';
import { useEffect, useState } from 'react';
import { PlaceholderContainer } from '../PlaceholderContainer';
import { MetricPlugin, type TMetricElement } from '../../plugins/metric-plugin';

type MetricElementProps = PlateElementProps<TMetricElement>;

export const MetricElement = withHOC(
  ResizableProvider,
  function MetricElement({ children, ...props }: MetricElementProps) {
    const [openModal, setOpenModal] = useState(false);
    const { openAddMetricModal } = props.editor.getPlugin(MetricPlugin).options;

    const metricId = '';

    const width = useResizableValue('width');
    const align = 'center'; // Default align for metrics

    const { attributes, ...elementProps } = props;
    const { plugin } = props;

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
          <PlaceholderContainer>
            <div className="text-sm text-gray-500">Metric: {metricId}</div>
          </PlaceholderContainer>

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

    useEffect(() => {
      if (openAddMetricModal) {
        setOpenModal(true);
      }
    }, [openAddMetricModal]);

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
