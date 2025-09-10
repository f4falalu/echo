import { useToggleButton, useToggleButtonState } from '@platejs/toggle/react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { Button } from '@/components/ui/buttons';
import { ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';

export function ToggleElement(props: PlateElementProps) {
  const element = props.element;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);

  return (
    <PlateElement {...props} className="pl-6">
      <Button
        size="small"
        variant="ghost"
        className="absolute top-0 -left-0.5 size-6 cursor-pointer items-center justify-center rounded-md p-px text-muted-foreground transition-colors select-none hover:bg-accent [&_svg]:size-4"
        contentEditable={false}
        {...buttonProps}
        prefix={
          <div className={cn('transition-transform duration-100', open ? 'rotate-90' : 'rotate-0')}>
            <ChevronRight />
          </div>
        }
      />
      {props.children}
    </PlateElement>
  );
}
