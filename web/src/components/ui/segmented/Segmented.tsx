'use client';

import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { useEffect, useState } from 'react';
import { cva } from 'class-variance-authority';
import { useMemoizedFn } from 'ahooks';

export interface SegmentedItem {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedProps {
  items: SegmentedItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  size?: 'default' | 'large';
  block?: boolean;
  type?: 'button' | 'track';
}

const segmentedVariants = cva('relative inline-flex items-center rounded-md', {
  variants: {
    block: {
      true: 'w-full',
      false: ''
    },
    size: {
      default: '',
      large: ''
    },
    type: {
      button: 'bg-transparent',
      track: 'bg-item-select'
    }
  }
});

const triggerVariants = cva(
  'relative z-10 flex items-center justify-center gap-x-1.5 gap-y-1 rounded-md transition-colors',
  {
    variants: {
      size: {
        default: 'px-2.5 flex-row',
        large: 'px-3 flex-col'
      },
      block: {
        true: 'flex-1',
        false: ''
      },
      disabled: {
        true: '!text-foreground/30 !hover:text-foreground/30 cursor-not-allowed',
        false: 'cursor-pointer'
      },
      selected: {
        true: 'text-foreground',
        false: 'text-gray-dark hover:text-foreground'
      },
      hovered: {
        true: '',
        false: ''
      }
    }
  }
);

const gliderVariants = cva('absolute border-border rounded-md border', {
  variants: {
    type: {
      button: 'bg-item-select',
      track: 'bg-background'
    }
  }
});
export const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(
  ({ items, type = 'track', value, onChange, className, size = 'default', block = false }, ref) => {
    const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
    const [selectedValue, setSelectedValue] = useState(value || items[0]?.value);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const [gliderStyle, setGliderStyle] = useState({
      width: 0,
      transform: 'translateX(0)'
    });

    const height = size === 'default' ? 'h-[28px]' : 'h-[50px]';

    useEffect(() => {
      if (value !== undefined && value !== selectedValue) {
        setSelectedValue(value);
      }
    }, [value]);

    useEffect(() => {
      const selectedTab = tabRefs.current.get(selectedValue);
      if (selectedTab) {
        const { offsetWidth, offsetLeft } = selectedTab;
        setGliderStyle({
          width: offsetWidth,
          transform: `translateX(${offsetLeft}px)`
        });
      }
    }, [selectedValue]);

    const handleValueChange = useMemoizedFn((newValue: string) => {
      setSelectedValue(newValue);
      onChange?.(newValue);
    });

    return (
      <Tabs.Root
        ref={ref}
        value={selectedValue}
        onValueChange={handleValueChange}
        className={cn(segmentedVariants({ block, type }), height, className)}>
        <motion.div
          className={cn(gliderVariants({ type }), height)}
          initial={false}
          animate={{
            width: gliderStyle.width,
            x: parseInt(gliderStyle.transform.replace('translateX(', '').replace('px)', ''))
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35
          }}
        />
        <Tabs.List
          className="relative z-10 flex w-full items-center gap-1"
          aria-label="Segmented Control">
          {items.map((item) => (
            <SegmentedTrigger
              key={item.value}
              item={item}
              selectedValue={selectedValue}
              hoveredValue={hoveredValue}
              size={size}
              block={block}
              setHoveredValue={setHoveredValue}
              tabRefs={tabRefs}
            />
          ))}
        </Tabs.List>
      </Tabs.Root>
    );
  }
);

Segmented.displayName = 'Segmented';

const SegmentedTrigger = React.memo<{
  item: SegmentedItem;
  selectedValue: string;
  hoveredValue: string | null;
  size: SegmentedProps['size'];
  block: SegmentedProps['block'];
  setHoveredValue: (value: string | null) => void;
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}>(({ item, selectedValue, hoveredValue, size, block, setHoveredValue, tabRefs }) => {
  return (
    <Tabs.Trigger
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      ref={(el) => {
        if (el) tabRefs.current.set(item.value, el);
      }}
      onMouseEnter={() => !item.disabled && setHoveredValue(item.value)}
      onMouseLeave={() => setHoveredValue(null)}
      className={cn(
        'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        triggerVariants({
          size,
          block,
          disabled: item.disabled,
          selected: selectedValue === item.value,
          hovered: hoveredValue === item.value
        })
      )}>
      {item.icon && <span className={cn('flex items-center text-sm')}>{item.icon}</span>}
      <span className={cn('text-sm')}>{item.label}</span>
    </Tabs.Trigger>
  );
});

SegmentedTrigger.displayName = 'SegmentedTrigger';
