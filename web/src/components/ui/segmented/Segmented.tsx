'use client';

import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { useEffect, useState } from 'react';

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
}

export const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(
  ({ items, value, onChange, className, size = 'default' }, ref) => {
    const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
    const [selectedValue, setSelectedValue] = useState(value || items[0]?.value);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const [gliderStyle, setGliderStyle] = useState({
      width: 0,
      transform: 'translateX(0)'
    });

    const height = size === 'default' ? 'h-[28px]' : 'h-[50px]';
    const innerHeight = size === 'default' ? 'h-[28px]' : 'h-[50px]';
    const padding = size === 'default' ? 'p-[0px]' : 'p-[0px]';

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

    const handleValueChange = (newValue: string) => {
      setSelectedValue(newValue);
      onChange?.(newValue);
    };

    return (
      <Tabs.Root
        ref={ref}
        value={selectedValue}
        onValueChange={handleValueChange}
        className={cn(
          'bg-item-select relative inline-flex items-center rounded-lg',
          height,
          padding,
          className
        )}>
        <motion.div
          className={cn('absolute rounded-md border border-gray-200 bg-white', innerHeight)}
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
        <Tabs.List className="relative z-10 flex items-center gap-1" aria-label="Segmented Control">
          {items.map((item) => (
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
                'relative z-10 flex items-center justify-center gap-2 rounded-md px-2.5 text-sm transition-colors',
                innerHeight,
                'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                selectedValue === item.value
                  ? 'text-foreground'
                  : 'text-gray-dark hover:text-foreground',
                hoveredValue === item.value && selectedValue !== item.value && 'bg-gray-50/50',
                item.disabled
                  ? 'text-foreground/30 hover:text-foreground/30 cursor-not-allowed'
                  : 'cursor-pointer'
              )}>
              {item.icon && <span className="flex items-center">{item.icon}</span>}
              {item.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>
    );
  }
);

Segmented.displayName = 'Segmented';
