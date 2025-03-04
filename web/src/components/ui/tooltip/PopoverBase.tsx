'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';
import { useMemoizedFn } from 'ahooks';
import { cva, VariantProps } from 'class-variance-authority';

export type PopoverTriggerType = 'click' | 'hover';

const Popover = PopoverPrimitive.Root;

interface PopoverProps extends React.ComponentPropsWithoutRef<typeof Popover> {
  triggerType?: PopoverTriggerType;
}

const PopoverRoot: React.FC<PopoverProps> = ({ children, triggerType = 'click', ...props }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleMouseEnter = useMemoizedFn(() => {
    if (triggerType === 'hover') {
      setIsOpen(true);
    }
  });

  const handleMouseLeave = useMemoizedFn(() => {
    if (triggerType === 'hover') {
      setIsOpen(false);
    }
  });

  const content =
    triggerType === 'hover' ? (
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="absolute -inset-[4px]" />
        <div className="relative z-10">{children}</div>
      </div>
    ) : (
      children
    );

  return (
    <Popover {...props} open={triggerType === 'hover' ? isOpen : undefined}>
      {content}
    </Popover>
  );
};

const PopoverTrigger = PopoverPrimitive.Trigger;

const popoverContentVariant = cva('', {
  variants: {
    size: {
      none: '',
      sm: 'p-1.5',
      default: 'p-2.5',
      md: 'p-3',
      lg: 'p-4'
    }
  },
  defaultVariants: {
    size: 'default'
  }
});

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    headerContent?: React.ReactNode;
  } & VariantProps<typeof popoverContentVariant>
>(
  (
    { className, align = 'center', children, sideOffset = 4, headerContent, size, ...props },
    ref
  ) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground',
          'w-fit rounded border shadow outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50'
        )}
        {...props}>
        {headerContent && <>{headerContent}</>}
        <div className={cn(popoverContentVariant({ size }), className)}>{children}</div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { PopoverRoot, PopoverTrigger, PopoverContent };
