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

interface RadixSegmentedProps {
  items: SegmentedItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const RadixSegmented = React.forwardRef<HTMLDivElement, RadixSegmentedProps>(
  ({ items, value, onChange, className }, ref) => {
    const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
    const [selectedValue, setSelectedValue] = useState(value || items[0]?.value);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const [gliderStyle, setGliderStyle] = useState({
      width: 0,
      transform: 'translateX(0)'
    });

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
          'relative inline-flex h-10 items-center rounded-lg bg-gray-100 p-1',
          className
        )}>
        <motion.div
          className="absolute h-8 rounded-md bg-white shadow-sm"
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
                'relative z-10 flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                selectedValue === item.value
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900',
                hoveredValue === item.value && selectedValue !== item.value && 'bg-gray-50/50',
                item.disabled && 'cursor-not-allowed opacity-50 hover:text-gray-500'
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

RadixSegmented.displayName = 'RadixSegmented';
