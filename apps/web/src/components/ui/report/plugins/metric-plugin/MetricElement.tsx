import type { PluginConfig, TElement } from 'platejs';
import { PlateElement, type PlateElementProps, withHOC, useFocused, useSelected } from 'platejs/react';
import { ResizableProvider, useResizableValue } from '@platejs/resizable';
import { cn } from '@/lib/utils';
import { MetricEmbedPlaceholder } from './MetricPlaceholder';
import { Caption, CaptionTextarea } from '../../elements/CaptionNode';
import { mediaResizeHandleVariants, Resizable, ResizeHandle } from '../../elements/ResizeHandle';

type MetricElementProps = PlateElementProps<TElement, PluginConfig<'metric', { metricId: string }>>;

export const MetricElement = withHOC(
  ResizableProvider,
  function MetricElement({ children, ...props }: MetricElementProps) {
    const { metricId } = props.getOptions();
    const focused = useFocused();
    const selected = useSelected();
    const width = useResizableValue('width');
    const align = 'center'; // Default align for metrics

    const { attributes, ...rest } = props;

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
          <div className={cn(
            'bg-gray-light/30 h-32 w-full overflow-hidden rounded border-2 border-dashed border-gray-300 flex items-center justify-center',
            focused && selected && 'ring-ring ring-2 ring-offset-2'
          )}>
            <div className="text-gray-500 text-sm">Metric: {metricId}</div>
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
      <MetricEmbedPlaceholder {...props} children={children} />
    );

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
  }
);